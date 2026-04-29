/**
 * Seed feedback/reviews from the Google Form spreadsheet data.
 * Uses the 2 APPROVED milestones from seed-escrows.js as the basis.
 * Run with: node src/scripts/seed-feedback.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Seeding feedback from spreadsheet data...\n');

  // Get the 2 approved milestones
  const { data: milestones, error: msErr } = await supabase
    .from('Milestone')
    .select('id, escrowId, status')
    .eq('status', 'APPROVED');

  if (msErr || !milestones?.length) {
    console.error('No approved milestones found. Run seed-escrows.js first.');
    return;
  }

  // Get escrow details for each milestone
  const feedbackToInsert = [];

  for (const ms of milestones) {
    const { data: escrow } = await supabase
      .from('Escrow')
      .select('clientWallet, freelancerWallet')
      .eq('id', ms.escrowId)
      .single();

    if (!escrow) continue;

    // Check if feedback already exists
    const { data: existing } = await supabase
      .from('Feedback')
      .select('id')
      .eq('milestoneId', ms.id)
      .maybeSingle();

    if (existing) {
      console.log(`  ↺ Feedback already exists for milestone ${ms.id.slice(0, 8)}...`);
      continue;
    }

    // CLIENT_REVIEW: client reviews the freelancer
    feedbackToInsert.push({
      milestoneId: ms.id,
      reviewerWallet: escrow.clientWallet,
      reviewedWallet: escrow.freelancerWallet,
      rating: 5,
      comment: 'Excellent work. Delivered exactly as specified, on time. The Soroban contract integration was flawless and the IPFS submission worked perfectly.',
      roleType: 'CLIENT_REVIEW',
    });

    // FREELANCER_REVIEW: freelancer reviews the client
    feedbackToInsert.push({
      milestoneId: ms.id,
      reviewerWallet: escrow.freelancerWallet,
      reviewedWallet: escrow.clientWallet,
      rating: 5,
      comment: 'Great client. Clear requirements, prompt payment via the escrow contract. The milestone-based flow made everything transparent and trustless.',
      roleType: 'FREELANCER_REVIEW',
    });
  }

  for (const fb of feedbackToInsert) {
    const { error } = await supabase.from('Feedback').insert(fb);
    if (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    } else {
      console.log(`  ✓ ${fb.roleType} inserted (${fb.reviewerWallet.slice(0, 8)}... → ${fb.reviewedWallet.slice(0, 8)}...)`);
    }
  }

  // Update reputation for reviewed users
  const reviewedWallets = [...new Set(feedbackToInsert.map(f => f.reviewedWallet))];
  for (const wallet of reviewedWallets) {
    const { data: allReviews } = await supabase
      .from('Feedback')
      .select('rating')
      .eq('reviewedWallet', wallet);

    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase.from('User').update({ reputation: avg }).eq('walletAddress', wallet);
      console.log(`  ↺ Reputation updated for ${wallet.slice(0, 8)}... → ${avg.toFixed(1)}`);
    }
  }

  console.log('\nDone.');
}

main().catch(console.error);
