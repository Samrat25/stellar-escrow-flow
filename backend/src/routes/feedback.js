import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * POST /feedback/submit
 * Submit feedback for completed escrow
 */
router.post('/submit', async (req, res) => {
  try {
    const { escrowId, userId, rating, comment, category } = req.body;

    // Validation
    if (!escrowId || !userId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify escrow exists
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only provide feedback on completed escrows' });
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        escrowId,
        userId,
        rating,
        comment,
        category: category || 'GENERAL'
      }
    });

    // Update user reputation based on average rating
    const allFeedback = await prisma.feedback.findMany({
      where: {
        OR: [
          { userId },
          { escrow: { clientWallet: (await prisma.user.findUnique({ where: { id: userId } }))?.walletAddress } }
        ]
      }
    });

    if (allFeedback.length > 0) {
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
      await prisma.user.update({
        where: { id: userId },
        data: { reputation: Math.min(5, avgRating) }
      });
    }

    res.json({
      success: true,
      feedbackId: feedback.id,
      feedbackCount: allFeedback.length
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/escrow/:escrowId
 * Get feedback for escrow
 */
router.get('/escrow/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;

    const feedbacks = await prisma.feedback.findMany({
      where: { escrowId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
            reputation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/user/:userId
 * Get feedback for user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      include: {
        escrow: {
          select: {
            id: true,
            contractId: true,
            clientWallet: true,
            freelancerWallet: true,
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    res.json({
      feedbacks,
      stats: {
        totalFeedback: feedbacks.length,
        averageRating: parseFloat(avgRating.toFixed(2)),
        byCategory: feedbacks.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/stats
 * Get feedback statistics for improvement analysis
 */
router.get('/stats', async (req, res) => {
  try {
    const totalFeedback = await prisma.feedback.count();
    
    const feedbacks = await prisma.feedback.findMany();

    const stats = {
      total: totalFeedback,
      averageRating: totalFeedback > 0
        ? parseFloat((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2))
        : 0,
      byRating: {
        5: feedbacks.filter(f => f.rating === 5).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        1: feedbacks.filter(f => f.rating === 1).length
      },
      byCategory: feedbacks.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {}),
      recentComments: feedbacks
        .filter(f => f.comment)
        .slice(-10)
        .map(f => ({
          comment: f.comment,
          rating: f.rating,
          category: f.category,
          createdAt: f.createdAt
        }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
