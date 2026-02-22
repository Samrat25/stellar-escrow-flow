import express from 'express';
import { getDatabase } from '../config/database.js';
import { sanitizeText } from '../utils/sanitize.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * POST /feedback/create
 * Create feedback for completed milestone
 */
router.post('/create', async (req, res) => {
  try {
    const { milestoneId, reviewerWallet, reviewedWallet, rating, comment, roleType } = req.body;

    // Validation
    if (!milestoneId || !reviewerWallet || !reviewedWallet || !rating || !roleType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!['CLIENT_REVIEW', 'FREELANCER_REVIEW'].includes(roleType)) {
      return res.status(400).json({ error: 'Invalid role type' });
    }

    // Prevent self-review
    if (reviewerWallet === reviewedWallet) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    // Sanitize comment to remove emojis and special characters
    const sanitizedComment = sanitizeText(comment);

    // Get milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Check milestone is approved/released
    if (milestone.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Can only review completed milestones' });
    }

    // Validate reviewer role
    if (roleType === 'CLIENT_REVIEW' && milestone.escrow.clientWallet !== reviewerWallet) {
      return res.status(403).json({ error: 'Only client can leave client review' });
    }

    if (roleType === 'FREELANCER_REVIEW' && milestone.escrow.freelancerWallet !== reviewerWallet) {
      return res.status(403).json({ error: 'Only freelancer can leave freelancer review' });
    }

    // Check for duplicate review
    const existing = await prisma.feedback.findFirst({
      where: {
        milestoneId,
        roleType
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Review already submitted for this milestone' });
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        milestoneId,
        reviewerWallet,
        reviewedWallet,
        rating: parseInt(rating),
        comment: sanitizedComment,
        roleType
      }
    });

    // Update user reputation
    const allReviews = await prisma.feedback.findMany({
      where: { reviewedWallet }
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { walletAddress: reviewedWallet },
      data: { reputation: avgRating }
    });

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/user/:wallet
 * Get all reviews for a user
 */
router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    const reviews = await prisma.feedback.findMany({
      where: { reviewedWallet: wallet },
      orderBy: { createdAt: 'desc' }
    });

    // Get reviewer info for each review
    const reviewsWithInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await prisma.user.findUnique({
          where: { walletAddress: review.reviewerWallet }
        });

        return {
          ...review,
          reviewerUsername: reviewer?.username || 'Anonymous',
          reviewerAvatar: reviewer?.avatarUrl
        };
      })
    );

    res.json(reviewsWithInfo);
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/latest
 * Get latest 10 reviews for landing page
 */
router.get('/latest', async (req, res) => {
  try {
    const reviews = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get user info for each review
    const reviewsWithInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await prisma.user.findUnique({
          where: { walletAddress: review.reviewerWallet }
        });

        const reviewed = await prisma.user.findUnique({
          where: { walletAddress: review.reviewedWallet }
        });

        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          roleType: review.roleType,
          createdAt: review.createdAt,
          reviewer: {
            username: reviewer?.username || 'Anonymous',
            avatarUrl: reviewer?.avatarUrl,
            role: reviewer?.role
          },
          reviewed: {
            username: reviewed?.username || 'Anonymous',
            role: reviewed?.role
          }
        };
      })
    );

    res.json(reviewsWithInfo);
  } catch (error) {
    console.error('Get latest feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/client
 * Get reviews given TO clients
 */
router.get('/client', async (req, res) => {
  try {
    const reviews = await prisma.feedback.findMany({
      where: { roleType: 'FREELANCER_REVIEW' },
      orderBy: { createdAt: 'desc' }
    });

    const reviewsWithInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await prisma.user.findUnique({
          where: { walletAddress: review.reviewerWallet }
        });

        const reviewed = await prisma.user.findUnique({
          where: { walletAddress: review.reviewedWallet }
        });

        return {
          ...review,
          reviewerUsername: reviewer?.username || 'Anonymous',
          reviewerAvatar: reviewer?.avatarUrl,
          reviewedUsername: reviewed?.username || 'Anonymous'
        };
      })
    );

    res.json(reviewsWithInfo);
  } catch (error) {
    console.error('Get client feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/freelancer
 * Get reviews given TO freelancers
 */
router.get('/freelancer', async (req, res) => {
  try {
    const reviews = await prisma.feedback.findMany({
      where: { roleType: 'CLIENT_REVIEW' },
      orderBy: { createdAt: 'desc' }
    });

    const reviewsWithInfo = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await prisma.user.findUnique({
          where: { walletAddress: review.reviewerWallet }
        });

        const reviewed = await prisma.user.findUnique({
          where: { walletAddress: review.reviewedWallet }
        });

        return {
          ...review,
          reviewerUsername: reviewer?.username || 'Anonymous',
          reviewerAvatar: reviewer?.avatarUrl,
          reviewedUsername: reviewed?.username || 'Anonymous'
        };
      })
    );

    res.json(reviewsWithInfo);
  } catch (error) {
    console.error('Get freelancer feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
