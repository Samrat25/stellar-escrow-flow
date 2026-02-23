import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /users/active
 * Get all active users with computed role metrics
 * Returns only users with real activity (milestones or feedback)
 */
router.get('/active', async (req, res) => {
  try {
    // Query to get active users with computed metrics
    const activeUsers = await prisma.$queryRaw`
      SELECT 
        u."walletAddress",
        u."username",
        u."createdAt",
        u."bio",
        u."avatarUrl",
        
        -- Client activity count
        COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" THEN e."id" END)::int as "timesAsClient",
        
        -- Freelancer activity count
        COUNT(DISTINCT CASE WHEN e."freelancerWallet" = u."walletAddress" THEN e."id" END)::int as "timesAsFreelancer",
        
        -- Total milestones (as client or freelancer)
        COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress" THEN m."id" END)::int as "totalMilestones",
        
        -- Completed milestones (APPROVED status)
        COUNT(DISTINCT CASE 
          WHEN (e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress") 
          AND m."status" = 'APPROVED' 
          THEN m."id" 
        END)::int as "completedMilestones",
        
        -- Total earned (as freelancer, APPROVED milestones only)
        COALESCE(SUM(CASE 
          WHEN e."freelancerWallet" = u."walletAddress" AND m."status" = 'APPROVED' 
          THEN m."amount" 
        END), 0)::float as "totalEarned",
        
        -- Total spent (as client, APPROVED milestones only)
        COALESCE(SUM(CASE 
          WHEN e."clientWallet" = u."walletAddress" AND m."status" = 'APPROVED' 
          THEN m."amount" 
        END), 0)::float as "totalSpent",
        
        -- Average rating (from feedback received)
        COALESCE(AVG(f."rating"), 0)::float as "averageRating",
        
        -- Feedback count
        COUNT(DISTINCT f."id")::int as "feedbackCount"

      FROM "User" u
      LEFT JOIN "Escrow" e ON (e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress")
      LEFT JOIN "Milestone" m ON m."escrowId" = e."id"
      LEFT JOIN "Feedback" f ON f."reviewedWallet" = u."walletAddress"

      GROUP BY u."walletAddress", u."username", u."createdAt", u."bio", u."avatarUrl"

      HAVING 
        COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" THEN e."id" END) > 0
        OR COUNT(DISTINCT CASE WHEN e."freelancerWallet" = u."walletAddress" THEN e."id" END) > 0
        OR COUNT(DISTINCT f."id") > 0

      ORDER BY "totalMilestones" DESC, "completedMilestones" DESC
    `;

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
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT u."walletAddress")::int as "totalUsers",
        COUNT(DISTINCT CASE WHEN e."clientWallet" IS NOT NULL THEN e."clientWallet" END)::int as "totalClients",
        COUNT(DISTINCT CASE WHEN e."freelancerWallet" IS NOT NULL THEN e."freelancerWallet" END)::int as "totalFreelancers",
        COUNT(DISTINCT e."id")::int as "totalEscrows",
        COUNT(DISTINCT CASE WHEN m."status" = 'APPROVED' THEN m."id" END)::int as "completedMilestones",
        COALESCE(SUM(CASE WHEN m."status" = 'APPROVED' THEN m."amount" END), 0)::float as "totalXlmReleased"
      FROM "User" u
      LEFT JOIN "Escrow" e ON (e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress")
      LEFT JOIN "Milestone" m ON m."escrowId" = e."id"
    `;

    res.json(stats[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
