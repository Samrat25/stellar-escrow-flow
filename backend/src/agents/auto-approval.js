import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import ContractService from '../services/contract.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Auto-Approval Agent
 * Runs every 5 minutes to check for expired review windows
 * and automatically approve milestones
 */

async function checkAndAutoApprove() {
  console.log(`[${new Date().toISOString()}] Running auto-approval check...`);

  try {
    // Find submitted milestones with expired review deadlines
    const { data: expiredMilestones, error } = await supabase
      .from('milestones')
      .select(`
        *,
        escrows (*)
      `)
      .eq('status', 'SUBMITTED')
      .lt('review_deadline', new Date().toISOString());

    if (error) {
      console.error('Error fetching expired milestones:', error);
      return;
    }

    if (!expiredMilestones || expiredMilestones.length === 0) {
      console.log('No milestones to auto-approve');
      return;
    }

    console.log(`Found ${expiredMilestones.length} milestone(s) to auto-approve`);

    // Process each expired milestone
    for (const milestone of expiredMilestones) {
      try {
        const escrow = milestone.escrows;
        
        console.log(`Auto-approving milestone ${milestone.milestone_index} for escrow ${escrow.id}`);

        // Call contract to auto-approve
        const contractService = new ContractService(escrow.contract_id);
        const result = await contractService.autoApproveMilestone(
          escrow.id,
          milestone.milestone_index
        );

        if (!result.success) {
          console.error(`Failed to auto-approve milestone ${milestone.id}:`, result.error);
          continue;
        }

        // Update milestone status
        const { error: updateError } = await supabase
          .from('milestones')
          .update({
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
            auto_approved: true,
            approval_tx_hash: result.txHash
          })
          .eq('id', milestone.id);

        if (updateError) {
          console.error(`Failed to update milestone ${milestone.id}:`, updateError);
          continue;
        }

        console.log(`✅ Auto-approved milestone ${milestone.milestone_index}`);
        console.log(`   Tx: ${result.txHash}`);
        console.log(`   Explorer: ${result.explorerUrl}`);

        // Check if all milestones are now approved
        const { data: allMilestones } = await supabase
          .from('milestones')
          .select('status')
          .eq('escrow_id', escrow.id);

        const allApproved = allMilestones.every(m => m.status === 'APPROVED');

        if (allApproved) {
          await supabase
            .from('escrows')
            .update({ 
              status: 'COMPLETED',
              completed_at: new Date().toISOString()
            })
            .eq('id', escrow.id);

          console.log(`🎉 Escrow ${escrow.id} completed!`);
        }

      } catch (milestoneError) {
        console.error(`Error processing milestone ${milestone.id}:`, milestoneError);
      }
    }

  } catch (error) {
    console.error('Auto-approval agent error:', error);
  }
}

// Run immediately on start
console.log('🤖 Auto-Approval Agent starting...');
checkAndAutoApprove();

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  checkAndAutoApprove();
});

console.log('⏰ Scheduled to run every 5 minutes');
