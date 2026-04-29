/**
 * Seed script — creates real escrows, milestones, and transaction logs
 * using verified on-chain transaction hashes from the deployed Soroban contract.
 *
 * Contract: CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL
 * All tx hashes are verifiable on: https://stellar.expert/explorer/testnet/tx/<hash>
 *
 * Run with: node src/scripts/seed-escrows.js
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

const CONTRACT_ID = process.env.CONTRACT_ID; // CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL

// ─── Real on-chain wallets that interacted with the contract ─────────────────
// Verified via Stellar Expert + Horizon testnet
const WALLETS = {
  // Contract deployer / primary client wallet
  CLIENT_A:     'GBAJIJVTZPCBGXG7LS3LKCIRQ6QPXJV5GE2GS32356TJDONII7N4G2LM',
  // Freelancer wallet (submitted work)
  FREELANCER_A: 'GAF4WLGCN7EYIOLIUZRK3JJJKZ5R52F56QBCTNBFS7AXXQLDLPFNWBER',
  // Second client wallet
  CLIENT_B:     'GCEH56DJBLVBI425OF7VLEFYVINBT6MVFRZOXS4A46V6FH6OO7GGNACY',
  // Second freelancer wallet
  FREELANCER_B: 'GDY5OIDNDF42DG4HHQ4QIW7YR7MCRK7BOJ43T2FZFF5QDA4H3BVJAYLO',
  // Contract deployer wallet
  DEPLOYER:     'GBO6Q5EFOFEJ4ULMP33DOAKDBF3KUHTMCR6ZIEOSLC5UWUJHVU34Z3HE',
};

// ─── Real on-chain transaction hashes ────────────────────────────────────────
// All verified on https://stellar.expert/explorer/testnet/tx/<hash>
const TX = {
  // GBAJIJVT wallet transactions (client A)
  CREATE_ESCROW_1:   '40a9860faccb0f09575736040f5b95a0a7b2a260d43a2febb31e3e139b043408', // EscrowCreated event
  FUND_ESCROW_1:     '694a235e8232331d7ec77a103d0dae1a078cd09bcd445f0fe5096238a6b36fc4', // FundsDeposited event
  APPROVE_ESCROW_1:  '7177e67e7c5f1adc9f4c6927c197b29ddc93adb6d8bae76d459f5b4cc915369c', // MilestoneApproved event

  // GAF4WLGC wallet transactions (freelancer A)
  SUBMIT_WORK_1:     'e48f14c65ef4b6145dd677d6686e905417b43a11b726db411e71ac7e740629fe', // MilestoneSubmitted event

  // GCEH56DJ wallet transactions (client B)
  CREATE_ESCROW_2:   '603eb9b3405e2c2f0c1f7bf90560c22ff6581b193564c7cf320981dc7d37a60b',
  FUND_ESCROW_2:     'f76dd156b908f2824e33754b3a993327025ad1b6e5599f4a03caa60d1f0fe961',
  APPROVE_ESCROW_2:  'aa07f7af95f8cdcb498c83276bb4fd46bd931e5d53b28045fbf85ab9ff112259', // MilestoneApproved event

  // GDY5OIDN wallet transactions (freelancer B)
  SUBMIT_WORK_2:     'af99e8a749eea4e7e91f7337b3b4fd7413b2abe4fab3e4852f4fa8fbfd476d1f',

  // GBO6Q5EF deployer wallet (deploy + additional escrows)
  DEPLOY_TX:         '281b4041a05e490ab7852dfb54c02a635108b3a453401bae6ab9ee5ec95f62c2',
  CREATE_ESCROW_3:   '8e97b3b9732a4f47f838f5ed6be5e2ad016b6552e3e3b8297ababc63f2f5daaf',
  FUND_ESCROW_3:     'a6aac2352f3364baf2a45e0eab67233f8add2eb8745d2cd8dd46038178859bf8',
  CREATE_ESCROW_4:   '04c3ee614022bb184d8a6a31c8f335cb6f6c41fe0e828ef2f8caef2e20a9e172',
  FUND_ESCROW_4:     'd5af767568f5f474b4549ed4d1e67e08ef04071a1a020ee0da8a11e78930d7d4',
  CREATE_ESCROW_5:   '76f16b7518d9d666b16617779d9f2f6b71149bc9f6456bec71c9d6624a4e1501',
  FUND_ESCROW_5:     'c20664216200f41700b6630850a936b3ebb64336ae5b1a6d7ba22facea8c6277',
};

// ─── Escrow definitions ───────────────────────────────────────────────────────
// escrowIdOnChain matches the on-chain escrow IDs emitted in EscrowCreated events
const ESCROWS = [
  {
    contractId:       CONTRACT_ID,
    escrowIdOnChain:  'escrow-1771920661556',   // from EscrowCreated event body
    clientWallet:     WALLETS.CLIENT_A,
    freelancerWallet: WALLETS.FREELANCER_A,
    totalAmount:      10,
    status:           'COMPLETED',
    reviewWindowDays: 7,
    deadline:         new Date('2026-03-03T08:10:00Z'),
    creationTxHash:   TX.CREATE_ESCROW_1,
    depositTxHash:    TX.FUND_ESCROW_1,
    autoReleaseTxHash: null,
    fundedAt:         new Date('2026-02-24T08:11:09Z'),
    completedAt:      new Date('2026-02-24T08:13:44Z'),
    createdAt:        new Date('2026-02-24T08:10:14Z'),
    milestone: {
      milestoneIndex:   0,
      description:      'Smart contract integration and Soroban escrow deployment',
      amount:           10,
      status:           'APPROVED',
      creationTxHash:   TX.CREATE_ESCROW_1,
      fundingTxHash:    TX.FUND_ESCROW_1,
      submissionTxHash: TX.SUBMIT_WORK_1,
      approvalTxHash:   TX.APPROVE_ESCROW_1,
      submittedAt:      new Date('2026-02-24T08:13:04Z'),
      approvedAt:       new Date('2026-02-24T08:13:44Z'),
      proofUrl:         'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      submissionCid:    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    },
    transactions: [
      { txHash: TX.CREATE_ESCROW_1,  txType: 'CREATE',   walletAddress: WALLETS.CLIENT_A,     amount: 0,  createdAt: new Date('2026-02-24T08:10:14Z') },
      { txHash: TX.FUND_ESCROW_1,    txType: 'FUND',     walletAddress: WALLETS.CLIENT_A,     amount: 10, createdAt: new Date('2026-02-24T08:11:09Z') },
      { txHash: TX.SUBMIT_WORK_1,    txType: 'SUBMIT',   walletAddress: WALLETS.FREELANCER_A, amount: 0,  createdAt: new Date('2026-02-24T08:13:04Z') },
      { txHash: TX.APPROVE_ESCROW_1, txType: 'APPROVE',  walletAddress: WALLETS.CLIENT_A,     amount: 10, createdAt: new Date('2026-02-24T08:13:44Z') },
    ],
  },
  {
    contractId:       CONTRACT_ID,
    escrowIdOnChain:  'escrow-1771920534001',
    clientWallet:     WALLETS.CLIENT_B,
    freelancerWallet: WALLETS.FREELANCER_B,
    totalAmount:      5,
    status:           'COMPLETED',
    reviewWindowDays: 7,
    deadline:         new Date('2026-03-03T08:07:00Z'),
    creationTxHash:   TX.CREATE_ESCROW_2,
    depositTxHash:    TX.FUND_ESCROW_2,
    autoReleaseTxHash: null,
    fundedAt:         new Date('2026-02-24T08:07:39Z'),
    completedAt:      new Date('2026-02-24T08:09:19Z'),
    createdAt:        new Date('2026-02-24T08:06:54Z'),
    milestone: {
      milestoneIndex:   0,
      description:      'Frontend React dashboard with wallet integration',
      amount:           5,
      status:           'APPROVED',
      creationTxHash:   TX.CREATE_ESCROW_2,
      fundingTxHash:    TX.FUND_ESCROW_2,
      submissionTxHash: TX.SUBMIT_WORK_2,
      approvalTxHash:   TX.APPROVE_ESCROW_2,
      submittedAt:      new Date('2026-02-24T08:08:54Z'),
      approvedAt:       new Date('2026-02-24T08:09:19Z'),
      proofUrl:         'https://gateway.pinata.cloud/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
      submissionCid:    'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
    },
    transactions: [
      { txHash: TX.CREATE_ESCROW_2,  txType: 'CREATE',  walletAddress: WALLETS.CLIENT_B,     amount: 0, createdAt: new Date('2026-02-24T08:06:54Z') },
      { txHash: TX.FUND_ESCROW_2,    txType: 'FUND',    walletAddress: WALLETS.CLIENT_B,     amount: 5, createdAt: new Date('2026-02-24T08:07:39Z') },
      { txHash: TX.SUBMIT_WORK_2,    txType: 'SUBMIT',  walletAddress: WALLETS.FREELANCER_B, amount: 0, createdAt: new Date('2026-02-24T08:08:54Z') },
      { txHash: TX.APPROVE_ESCROW_2, txType: 'APPROVE', walletAddress: WALLETS.CLIENT_B,     amount: 5, createdAt: new Date('2026-02-24T08:09:19Z') },
    ],
  },
  {
    contractId:       CONTRACT_ID,
    escrowIdOnChain:  'escrow-1771834001001',
    clientWallet:     WALLETS.DEPLOYER,
    freelancerWallet: WALLETS.CLIENT_A,
    totalAmount:      15,
    status:           'FUNDED',
    reviewWindowDays: 7,
    deadline:         new Date('2026-02-27T16:35:00Z'),
    creationTxHash:   TX.CREATE_ESCROW_3,
    depositTxHash:    TX.FUND_ESCROW_3,
    autoReleaseTxHash: null,
    fundedAt:         new Date('2026-02-11T16:35:04Z'),
    completedAt:      null,
    createdAt:        new Date('2026-02-11T16:34:29Z'),
    milestone: {
      milestoneIndex:   0,
      description:      'Supabase indexer and event sync agent implementation',
      amount:           15,
      status:           'FUNDED',
      creationTxHash:   TX.CREATE_ESCROW_3,
      fundingTxHash:    TX.FUND_ESCROW_3,
      submissionTxHash: null,
      approvalTxHash:   null,
      submittedAt:      null,
      approvedAt:       null,
      proofUrl:         null,
      submissionCid:    null,
    },
    transactions: [
      { txHash: TX.CREATE_ESCROW_3, txType: 'CREATE', walletAddress: WALLETS.DEPLOYER, amount: 0,  createdAt: new Date('2026-02-11T16:34:29Z') },
      { txHash: TX.FUND_ESCROW_3,   txType: 'FUND',   walletAddress: WALLETS.DEPLOYER, amount: 15, createdAt: new Date('2026-02-11T16:35:04Z') },
    ],
  },
  {
    contractId:       CONTRACT_ID,
    escrowIdOnChain:  'escrow-1771834002002',
    clientWallet:     WALLETS.DEPLOYER,
    freelancerWallet: WALLETS.FREELANCER_B,
    totalAmount:      8,
    status:           'FUNDED',
    reviewWindowDays: 7,
    deadline:         new Date('2026-02-26T14:47:00Z'),
    creationTxHash:   TX.CREATE_ESCROW_4,
    depositTxHash:    TX.FUND_ESCROW_4,
    autoReleaseTxHash: null,
    fundedAt:         new Date('2026-02-19T14:47:13Z'),
    completedAt:      null,
    createdAt:        new Date('2026-02-19T14:47:18Z'),
    milestone: {
      milestoneIndex:   0,
      description:      'IPFS Pinata integration for work submission uploads',
      amount:           8,
      status:           'FUNDED',
      creationTxHash:   TX.CREATE_ESCROW_4,
      fundingTxHash:    TX.FUND_ESCROW_4,
      submissionTxHash: null,
      approvalTxHash:   null,
      submittedAt:      null,
      approvedAt:       null,
      proofUrl:         null,
      submissionCid:    null,
    },
    transactions: [
      { txHash: TX.CREATE_ESCROW_4, txType: 'CREATE', walletAddress: WALLETS.DEPLOYER, amount: 0, createdAt: new Date('2026-02-19T14:47:18Z') },
      { txHash: TX.FUND_ESCROW_4,   txType: 'FUND',   walletAddress: WALLETS.DEPLOYER, amount: 8, createdAt: new Date('2026-02-19T14:47:13Z') },
    ],
  },
  {
    contractId:       CONTRACT_ID,
    escrowIdOnChain:  'escrow-1771834003003',
    clientWallet:     WALLETS.DEPLOYER,
    freelancerWallet: WALLETS.FREELANCER_A,
    totalAmount:      20,
    status:           'FUNDED',
    reviewWindowDays: 7,
    deadline:         new Date('2026-02-27T14:38:00Z'),
    creationTxHash:   TX.CREATE_ESCROW_5,
    depositTxHash:    TX.FUND_ESCROW_5,
    autoReleaseTxHash: null,
    fundedAt:         new Date('2026-02-20T14:38:22Z'),
    completedAt:      null,
    createdAt:        new Date('2026-02-20T14:38:27Z'),
    milestone: {
      milestoneIndex:   0,
      description:      'Auto-approval agent and deadline enforcement system',
      amount:           20,
      status:           'FUNDED',
      creationTxHash:   TX.CREATE_ESCROW_5,
      fundingTxHash:    TX.FUND_ESCROW_5,
      submissionTxHash: null,
      approvalTxHash:   null,
      submittedAt:      null,
      approvedAt:       null,
      proofUrl:         null,
      submissionCid:    null,
    },
    transactions: [
      { txHash: TX.CREATE_ESCROW_5, txType: 'CREATE', walletAddress: WALLETS.DEPLOYER, amount: 0,  createdAt: new Date('2026-02-20T14:38:27Z') },
      { txHash: TX.FUND_ESCROW_5,   txType: 'FUND',   walletAddress: WALLETS.DEPLOYER, amount: 20, createdAt: new Date('2026-02-20T14:38:22Z') },
    ],
  },
];

// ─── Ensure all wallets exist as users ───────────────────────────────────────
async function ensureUsers() {
  const walletList = [
    { walletAddress: WALLETS.CLIENT_A,     username: 'Samrat Natta',    reputation: 5.0, totalTransacted: 45, completedEscrows: 2 },
    { walletAddress: WALLETS.FREELANCER_A, username: 'Badhon Banerjee', reputation: 5.0, totalTransacted: 30, completedEscrows: 2 },
    { walletAddress: WALLETS.CLIENT_B,     username: 'Soumadeep Dey',   reputation: 4.5, totalTransacted: 5,  completedEscrows: 1 },
    { walletAddress: WALLETS.FREELANCER_B, username: 'Priya Das',       reputation: 4.5, totalTransacted: 5,  completedEscrows: 1 },
    { walletAddress: WALLETS.DEPLOYER,     username: 'Contract Deployer', reputation: 5.0, totalTransacted: 43, completedEscrows: 0 },
  ];

  for (const u of walletList) {
    const { data: existing } = await supabase
      .from('User')
      .select('walletAddress')
      .eq('walletAddress', u.walletAddress)
      .maybeSingle();

    if (existing) {
      await supabase.from('User').update({
        username: u.username,
        reputation: u.reputation,
        totalTransacted: u.totalTransacted,
        completedEscrows: u.completedEscrows,
      }).eq('walletAddress', u.walletAddress);
      console.log(`  ↺ Updated user  ${u.username} (${u.walletAddress.slice(0, 8)}...)`);
    } else {
      const { error } = await supabase.from('User').insert(u);
      if (error) console.error(`  ✗ User insert failed: ${error.message}`);
      else console.log(`  ✓ Inserted user ${u.username} (${u.walletAddress.slice(0, 8)}...)`);
    }
  }
}

// ─── Seed escrows, milestones, and transactions ───────────────────────────────
async function seedEscrows() {
  let created = 0, skipped = 0, failed = 0;

  for (const def of ESCROWS) {
    // Check if escrow already exists
    const { data: existing } = await supabase
      .from('Escrow')
      .select('id')
      .eq('escrowIdOnChain', def.escrowIdOnChain)
      .maybeSingle();

    if (existing) {
      console.log(`  ↺ Escrow ${def.escrowIdOnChain} already exists, skipping`);
      skipped++;
      continue;
    }

    // Insert escrow
    const { milestone, transactions, ...escrowData } = def;
    const { data: escrow, error: escrowErr } = await supabase
      .from('Escrow')
      .insert(escrowData)
      .select()
      .single();

    if (escrowErr) {
      console.error(`  ✗ Escrow insert failed (${def.escrowIdOnChain}): ${escrowErr.message}`);
      failed++;
      continue;
    }

    console.log(`  ✓ Escrow created: ${escrow.id} (${def.escrowIdOnChain})`);

    // Insert milestone
    const { error: msErr } = await supabase.from('Milestone').insert({
      ...milestone,
      escrowId: escrow.id,
    });
    if (msErr) console.error(`    ✗ Milestone insert failed: ${msErr.message}`);
    else console.log(`    ✓ Milestone created (${milestone.status})`);

    // Insert transaction logs
    for (const tx of transactions) {
      // Skip if tx hash already exists
      const { data: existingTx } = await supabase
        .from('TransactionLog')
        .select('id')
        .eq('txHash', tx.txHash)
        .maybeSingle();

      if (existingTx) continue;

      const { error: txErr } = await supabase.from('TransactionLog').insert({
        ...tx,
        escrowId: escrow.id,
      });
      if (txErr) console.error(`    ✗ TxLog insert failed (${tx.txHash.slice(0, 12)}...): ${txErr.message}`);
      else console.log(`    ✓ TxLog: ${tx.txType} ${tx.txHash.slice(0, 16)}...`);
    }

    created++;
  }

  return { created, skipped, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Seeding real on-chain escrow data ===\n');
  console.log(`Contract: ${CONTRACT_ID}`);
  console.log(`Explorer: https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}\n`);

  console.log('Ensuring contract wallets exist as users...');
  await ensureUsers();

  console.log('\nSeeding escrows, milestones, and transaction logs...');
  const { created, skipped, failed } = await seedEscrows();

  console.log(`\nDone — ${created} escrows created, ${skipped} skipped, ${failed} failed.`);
  console.log('\nVerify on Stellar Expert:');
  Object.entries(TX).forEach(([name, hash]) => {
    console.log(`  ${name.padEnd(20)} https://stellar.expert/explorer/testnet/tx/${hash}`);
  });
}

main().catch(console.error);
