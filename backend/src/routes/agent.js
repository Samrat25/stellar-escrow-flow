import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /agent/status
 * Get agent system status and recent activity
 */
router.get('/status', async (req, res) => {
  try {
    // Get recent agent logs (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const agentLogs = await prisma.agentLog.findMany({
      where: {
        createdAt: { gte: oneDayAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      total: agentLogs.length,
      byStatus: {
        PENDING: agentLogs.filter(l => l.status === 'PENDING').length,
        PROCESSING: agentLogs.filter(l => l.status === 'PROCESSING').length,
        SUCCESS: agentLogs.filter(l => l.status === 'SUCCESS').length,
        FAILED: agentLogs.filter(l => l.status === 'FAILED').length
      },
      byType: {
        AUTO_APPROVAL: agentLogs.filter(l => l.agentType === 'AUTO_APPROVAL').length,
        EVENT_SYNC: agentLogs.filter(l => l.agentType === 'EVENT_SYNC').length,
        FEEDBACK_ANALYSIS: agentLogs.filter(l => l.agentType === 'FEEDBACK_ANALYSIS').length
      }
    };

    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      stats,
      recentActivity: agentLogs.slice(0, 20).map(log => ({
        id: log.id,
        agentType: log.agentType,
        action: log.action,
        status: log.status,
        createdAt: log.createdAt,
        ...(log.txHash && { txHash: log.txHash }),
        ...(log.errorMessage && { error: log.errorMessage })
      }))
    });
  } catch (error) {
    console.error('Get agent status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /agent/logs
 * Get agent logs with optional filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const { agentType, status, escrowId, limit = 50 } = req.query;

    const where = {};
    if (agentType) where.agentType = agentType;
    if (status) where.status = status;
    if (escrowId) where.escrowId = escrowId;

    const logs = await prisma.agentLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 100)
    });

    res.json(logs);
  } catch (error) {
    console.error('Get agent logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /agent/pending-actions
 * Get pending actions that agents should process
 */
router.get('/pending-actions', async (req, res) => {
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

    // Find escrows past deadline
    const pastDeadlineEscrows = await prisma.escrow.findMany({
      where: {
        status: { in: ['FUNDED', 'ACTIVE'] },
        deadline: {
          lt: new Date()
        }
      }
    });

    res.json({
      pendingAutoApprovals: expiredMilestones.length,
      pendingAutoReleases: pastDeadlineEscrows.length,
      milestones: expiredMilestones.map(m => ({
        milestoneId: m.id,
        escrowId: m.escrowId,
        milestoneIndex: m.milestoneIndex,
        submittedAt: m.submittedAt,
        reviewDeadline: m.reviewDeadline
      })),
      escrows: pastDeadlineEscrows.map(e => ({
        escrowId: e.id,
        contractId: e.contractId,
        deadline: e.deadline,
        status: e.status
      }))
    });
  } catch (error) {
    console.error('Get pending actions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /agent/test
 * Test agent connectivity and status
 */
router.post('/test', async (req, res) => {
  try {
    // Create a test log entry
    const testLog = await prisma.agentLog.create({
      data: {
        agentType: 'TEST',
        action: 'SYSTEM_CHECK',
        status: 'SUCCESS',
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        })
      }
    });

    res.json({
      success: true,
      testId: testLog.id,
      message: 'Agent system is operational'
    });
  } catch (error) {
    console.error('Test agent error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
