import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();
const db = getDatabase();

/**
 * GET /users/active
 * Get all active users with computed role metrics
 * Returns only users with real activity (milestones or feedback)
 */
router.get('/active', async (req, res) => {
  try {
    // Get all users
    const users = await db.user.findMany();

    // Get all escrows
    const escrows = await db.escrow.findMany();

    // Get all milestones
    const milestones = await db.milestone.findMany();

    // Get all feedback
    const feedbacks = await db.feedback.findMany();

    // Compute metrics for each user
    const activeUsers = users.map(user => {
      const userEscrows = escrows.filter(e => 
        e.clientWallet === user.walletAddress || e.freelancerWallet === user.walletAddress
      );

      const timesAsClient = escrows.filter(e => e.clientWallet === user.walletAddress).length;
      const timesAsFreelancer = escrows.filter(e => e.freelancerWallet === user.walletAddress).length;

      const userMilestones = milestones.filter(m => 
        userEscrows.some(e => e.id === m.escrowId)
      );

      const completedMilestones = userMilestones.filter(m => m.status === 'APPROVED').length;

      const totalEarned = milestones
        .filter(m => {
          const escrow = escrows.find(e => e.id === m.escrowId);
          return escrow && escrow.freelancerWallet === user.walletAddress && m.status === 'APPROVED';
        })
        .reduce((sum, m) => sum + m.amount, 0);

      const totalSpent = milestones
        .filter(m => {
          const escrow = escrows.find(e => e.id === m.escrowId);
          return escrow && escrow.clientWallet === user.walletAddress && m.status === 'APPROVED';
        })
        .reduce((sum, m) => sum + m.amount, 0);

      const userFeedbacks = feedbacks.filter(f => f.reviewedWallet === user.walletAddress);
      const averageRating = userFeedbacks.length > 0
        ? userFeedbacks.reduce((sum, f) => sum + f.rating, 0) / userFeedbacks.length
        : 0;

      return {
        walletAddress: user.walletAddress,
        username: user.username,
        timesAsClient,
        timesAsFreelancer,
        totalMilestones: userMilestones.length,
        completedMilestones,
        totalEarned,
        totalSpent,
        averageRating: parseFloat(averageRating.toFixed(1)),
        feedbackCount: userFeedbacks.length
      };
    }).filter(user => 
      user.timesAsClient > 0 || user.timesAsFreelancer > 0 || user.feedbackCount > 0
    ).sort((a, b) => b.totalMilestones - a.totalMilestones);

    // Compute network stats
    const networkStats = {
      totalActiveUsers: activeUsers.length,
      totalUniqueClients: activeUsers.filter(u => u.timesAsClient > 0).length,
      totalUniqueFreelancers: activeUsers.filter(u => u.timesAsFreelancer > 0).length,
      totalProjectsCompleted: activeUsers.reduce((sum, u) => sum + u.completedMilestones, 0),
      totalXlmEscrowed: activeUsers.reduce((sum, u) => sum + u.totalEarned, 0)
    };

    res.json({
      users: activeUsers,
      stats: networkStats
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /users/stats
 * Get network-wide statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const users = await db.user.findMany();
    const escrows = await db.escrow.findMany();
    const milestones = await db.milestone.findMany();

    const completedMilestones = milestones.filter(m => m.status === 'APPROVED');
    const totalXlmReleased = completedMilestones.reduce((sum, m) => sum + m.amount, 0);

    const uniqueClients = new Set(escrows.map(e => e.clientWallet)).size;
    const uniqueFreelancers = new Set(escrows.map(e => e.freelancerWallet)).size;

    res.json({
      totalUsers: users.length,
      totalClients: uniqueClients,
      totalFreelancers: uniqueFreelancers,
      totalEscrows: escrows.length,
      completedMilestones: completedMilestones.length,
      totalXlmReleased
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
