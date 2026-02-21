import cron from 'node-cron';
import { getDatabase } from '../config/database.js';
import ContractService from '../services/contract.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Auto-Approval Agent
 * Runs every 5 minutes to:
 * 1. Check for expired review windows and automatically approve milestones
 * 2. Check for escrows past deadline and auto-release remaining funds
 */

async function checkAndAutoApprove() {
  const prisma = getDatabase();
  const checkStartTime = new Date();
  console.log(`\n[${checkStartTime.toISOString()}] Running auto-approval & auto-release check...`);

  try {
    // ===== PART 1: Auto-approve expired milestones =====
    
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

    console.log(`[AUTO-APPROVE] Found ${expiredMilestones.length} milestone(s) to approve`);

    // Process each expired milestone
    for (const milestone of expiredMilestones) {
      try {
        const escrow = milestone.escrow;
        
        console.log(`  → Auto-approving milestone ${milestone.milestoneIndex} for escrow ${escrow.id}`);

        // Log agent action
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'AUTO_APPROVAL',
            action: `AUTO_APPROVE_MILESTONE_${milestone.milestoneIndex}`,
            status: 'PROCESSING'
          }
        });

        // Call contract to auto-approve
        const contractService = new ContractService(escrow.contractId);
        const result = await contractService.autoApproveMilestone(
          escrow.id,
          milestone.milestoneIndex
        );

        if (!result.success) {
          console.error(`    ✗ Failed: ${result.error}`);
          
          await prisma.agentLog.create({
            data: {
              escrowId: escrow.id,
              agentType: 'AUTO_APPROVAL',
              action: `AUTO_APPROVE_MILESTONE_${milestone.milestoneIndex}`,
              status: 'FAILED',
              errorMessage: result.error
            }
          });
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
            status: 'SUCCESS'
          }
        });

        // Log successful agent action
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'AUTO_APPROVAL',
            action: `AUTO_APPROVE_MILESTONE_${milestone.milestoneIndex}`,
            status: 'SUCCESS',
            txHash: result.txHash
          }
        });

        console.log(`    ✓ Approved | Tx: ${result.txHash.slice(0, 16)}...`);

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

          console.log(`    🎉 Escrow completed!`);
        }

      } catch (milestoneError) {
        console.error(`    ✗ Error: ${milestoneError.message}`);
      }
    }

    // ===== PART 2: Auto-release past deadline escrows =====
    
    const pastDeadlineEscrows = await prisma.escrow.findMany({
      where: {
        status: { in: ['FUNDED', 'ACTIVE'] },
        deadline: {
          lt: new Date()
        }
      }
    });

    console.log(`[AUTO-RELEASE] Found ${pastDeadlineEscrows.length} escrow(s) past deadline`);

    for (const escrow of pastDeadlineEscrows) {
      try {
        console.log(`  → Auto-releasing escrow ${escrow.id}`);

        // Log agent action
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'AUTO_APPROVAL',
            action: 'AUTO_RELEASE_ESCROW',
            status: 'PROCESSING'
          }
        });

        // Call contract to auto-release
        const contractService = new ContractService(escrow.contractId);
        const result = await contractService.autoReleaseEscrow(escrow.id);

        if (!result.success) {
          console.error(`    ✗ Failed: ${result.error}`);
          
          await prisma.agentLog.create({
            data: {
              escrowId: escrow.id,
              agentType: 'AUTO_APPROVAL',
              action: 'AUTO_RELEASE_ESCROW',
              status: 'FAILED',
              errorMessage: result.error
            }
          });
          continue;
        }

        // Update escrow status
        await prisma.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            autoReleaseTxHash: result.txHash
          }
        });

        // Log transaction
        await prisma.transactionLog.create({
          data: {
            escrowId: escrow.id,
            txHash: result.txHash,
            txType: 'AUTO_RELEASE',
            walletAddress: escrow.freelancerWallet,
            amount: escrow.totalAmount,
            status: 'SUCCESS'
          }
        });

        // Log successful agent action
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'AUTO_APPROVAL',
            action: 'AUTO_RELEASE_ESCROW',
            status: 'SUCCESS',
            txHash: result.txHash
          }
        });

        console.log(`    ✓ Released | Tx: ${result.txHash.slice(0, 16)}...`);

      } catch (escrowError) {
        console.error(`    ✗ Error: ${escrowError.message}`);
      }
    }

    const checkEndTime = new Date();
    const duration = checkEndTime - checkStartTime;
    console.log(`✅ Check completed in ${duration}ms\n`);

  } catch (error) {
    console.error('Auto-approval agent error:', error);
  }
}

// Run immediately on start
console.log('🤖 Auto-Approval & Auto-Release Agent starting...');
checkAndAutoApprove();

// Schedule to run every 5 minutes
const checkInterval = parseInt(process.env.AGENT_CHECK_INTERVAL_MINUTES || '5');
cron.schedule(`*/${checkInterval} * * * *`, () => {
  checkAndAutoApprove();
});

console.log(`⏰ Scheduled to run every ${checkInterval} minute(s)`);
