import cron from 'node-cron';
import prisma from '../config/prisma.js';
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
    const expiredMilestones = await prisma.milestone.findMany({
      where: {
        status: 'SUBMITTED',
        reviewDeadline: {
          lt: new Date()
        }
      },
      include: {
        escrow: true
      }
    });

    if (!expiredMilestones || expiredMilestones.length === 0) {
      console.log('No milestones to auto-approve');
      return;
    }

    console.log(`Found ${expiredMilestones.length} milestone(s) to auto-approve`);

    // Process each expired milestone
    for (const milestone of expiredMilestones) {
      try {
        const escrow = milestone.escrow;
        
        console.log(`Auto-approving milestone ${milestone.milestoneIndex} for escrow ${escrow.id}`);

        // Call contract to auto-approve
        const contractService = new ContractService(escrow.contractId);
        const result = await contractService.autoApproveMilestone(
          escrow.id,
          milestone.milestoneIndex
        );

        if (!result.success) {
          console.error(`Failed to auto-approve milestone ${milestone.id}:`, result.error);
          continue;
        }

        // Update milestone status
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            autoApproved: true,
            approvalTxHash: result.txHash
          }
        });

        // Log transaction
        await prisma.transactionLog.create({
          data: {
            escrowId: escrow.id,
            milestoneId: milestone.id,
            txHash: result.txHash,
            txType: 'AUTO_APPROVE',
            walletAddress: escrow.freelancerWallet,
            amount: milestone.amount,
            metadata: JSON.stringify({ autoApproved: true })
          }
        });

        console.log(`✅ Auto-approved milestone ${milestone.milestoneIndex}`);
        console.log(`   Tx: ${result.txHash}`);
        console.log(`   Explorer: ${result.explorerUrl}`);

        // Check if all milestones are now approved
        const allMilestones = await prisma.milestone.findMany({
          where: { escrowId: escrow.id }
        });

        const allApproved = allMilestones.every(m => m.status === 'APPROVED');

        if (allApproved) {
          await prisma.escrow.update({
            where: { id: escrow.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });

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
