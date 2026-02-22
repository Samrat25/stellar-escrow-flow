import express from 'express';
import { getDatabase } from '../config/database.js';
import { sanitizeText } from '../utils/sanitize.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /profile/:wallet
 * Get user profile with stats
 */
router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    });

    if (!user) {
      // Auto-create profile on first access
      user = await prisma.user.create({
        data: {
          walletAddress: wallet,
          role: 'CLIENT',
          reputation: 5.0
        }
      });
    }

    // Get milestone stats
    const milestonesCreated = await prisma.milestone.count({
      where: {
        escrow: {
          clientWallet: wallet
        }
      }
    });

    const milestonesCompleted = await prisma.milestone.count({
      where: {
        escrow: {
          freelancerWallet: wallet
        },
        status: 'APPROVED'
      }
    });

    // Get reviews
    const reviews = await prisma.feedback.findMany({
      where: { reviewedWallet: wallet },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate average rating
    const allReviews = await prisma.feedback.findMany({
      where: { reviewedWallet: wallet }
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 5.0;

    res.json({
      ...user,
      stats: {
        milestonesCreated,
        milestonesCompleted,
        averageRating: avgRating.toFixed(1),
        totalReviews: allReviews.length
      },
      recentReviews: reviews
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /profile/update
 * Update user profile
 */
router.post('/update', async (req, res) => {
  try {
    const { walletAddress, username, bio, avatarUrl, role } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Validate role
    if (role && !['CLIENT', 'FREELANCER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Sanitize text fields to remove emojis
    const sanitizedUsername = sanitizeText(username);
    const sanitizedBio = sanitizeText(bio);

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        username: sanitizedUsername,
        bio: sanitizedBio,
        avatarUrl,
        role,
        updatedAt: new Date()
      },
      create: {
        walletAddress,
        username: sanitizedUsername,
        bio: sanitizedBio,
        avatarUrl,
        role: role || 'CLIENT',
        reputation: 5.0
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
