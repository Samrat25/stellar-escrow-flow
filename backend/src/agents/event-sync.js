import cron from 'node-cron';
import { getDatabase } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Event Sync Agent
 * Runs every 10 minutes to synchronize contract events with database
 * Listens for contract events and updates database state accordingly
 */

async function syncContractEvents() {
  const prisma = getDatabase();
  const syncStartTime = new Date();
  console.log(`\n[${syncStartTime.toISOString()}] Running event sync check...`);

  try {
    // Get all escrows that might have pending state changes
    const activeEscrows = await prisma.escrow.findMany({
      where: {
        status: { in: ['CREATED', 'FUNDED', 'ACTIVE'] }
      },
      include: {
        milestones: true
      }
    });

    console.log(`[SYNC] Checking ${activeEscrows.length} active escrow(s)`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const escrow of activeEscrows) {
      try {
        // Log sync action
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'EVENT_SYNC',
            action: 'SYNC_ESCROW_STATE',
            status: 'PROCESSING'
          }
        });

        // In a real implementation, you would query the Soroban contract here
        // to get the actual state and compare with database state
        // For now, we verify database consistency

        // Check milestone consistency
        let consistencyIssues = 0;
        
        for (const milestone of escrow.milestones) {
          // Verify milestone status makes sense
          if (milestone.status === 'APPROVED' && !milestone.approvedAt) {
            await prisma.milestone.update({
              where: { id: milestone.id },
              data: { approvedAt: new Date() }
            });
            consistencyIssues++;
          }
        }

        // Verify escrow state
        const allMilestones = escrow.milestones;
        const allApproved = allMilestones.every(m => m.status === 'APPROVED');
        
        if (allApproved && escrow.status !== 'COMPLETED') {
          await prisma.escrow.update({
            where: { id: escrow.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });
          consistencyIssues++;
        }

        // Log sync result
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'EVENT_SYNC',
            action: 'SYNC_ESCROW_STATE',
            status: 'SUCCESS',
            metadata: JSON.stringify({
              consistency_issues_fixed: consistencyIssues,
              milestone_count: allMilestones.length
            })
          }
        });

        console.log(`  ✓ Synced escrow ${escrow.id} (${consistencyIssues} fixes)`);
        syncedCount++;

      } catch (escrowError) {
        console.error(`  ✗ Error syncing escrow ${escrow.id}: ${escrowError.message}`);
        
        await prisma.agentLog.create({
          data: {
            escrowId: escrow.id,
            agentType: 'EVENT_SYNC',
            action: 'SYNC_ESCROW_STATE',
            status: 'FAILED',
            errorMessage: escrowError.message
          }
        });

        errorCount++;
      }
    }

    const syncEndTime = new Date();
    const duration = syncEndTime - syncStartTime;
    console.log(`✅ Sync completed: ${syncedCount} synced, ${errorCount} errors (${duration}ms)\n`);

  } catch (error) {
    console.error('Event sync agent error:', error);

    await prisma.agentLog.create({
      data: {
        agentType: 'EVENT_SYNC',
        action: 'SYNC_BATCH',
        status: 'FAILED',
        errorMessage: error.message
      }
    }).catch(err => console.error('Failed to log error:', err));
  }
}

// Run immediately on start
console.log('🤖 Event Sync Agent starting...');
syncContractEvents();

// Schedule to run every 10 minutes
cron.schedule('*/10 * * * *', () => {
  syncContractEvents();
});

console.log('⏰ Scheduled to run every 10 minutes');
