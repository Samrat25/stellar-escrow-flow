import express from 'express';
import { getDatabase } from '../config/database.js';
import { sanitizeText } from '../utils/sanitize.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /profile/:wallet
 * Get user profile with complete transaction history and real stats
 */
router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    // Validate wallet address format
    if (!wallet || !/^G[A-Z2-7]{55}$/.test(wallet)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: wallet }
    }).catch(err => {
      console.error('Database query error:', err);
      return null;
    });

    if (!user) {
      // Auto-create profile on first access
      try {
        user = await prisma.user.create({
          data: {
            walletAddress: wallet,
            role: 'CLIENT',
            reputation: 5.0
          }
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        // Return minimal profile if database fails
        return res.json({
          walletAddress: wallet,
          role: 'CLIENT',
          reputation: 5.0,
          stats: {
            totalEarnings: 0,
            totalSpending: 0,
            milestonesCreated: 0,
            milestonesCompleted: 0,
            averageRating: 5.0,
            totalReviews: 0
          },
          transactionHistory: [],
          reviews: []
        });
      }
    }

    // Get all escrows where user is freelancer
    const freelancerEscrows = await prisma.escrow.findMany({
      where: { freelancerWallet: wallet }
    });

    const freelancerEscrowIds = freelancerEscrows.map(e => e.id);

    // Get all APPROVED milestones for these escrows
    const freelancerMilestones = await prisma.milestone.findMany({
      where: {
        escrowId: { in: freelancerEscrowIds },
        status: 'APPROVED'
      },
      orderBy: { approvedAt: 'desc' }
    });

    // Attach escrow data to milestones
    const freelancerMilestonesWithEscrow = freelancerMilestones.map(m => ({
      ...m,
      escrow: freelancerEscrows.find(e => e.id === m.escrowId)
    }));

    // Calculate total earnings
    const totalEarnings = freelancerMilestones.reduce((sum, m) => sum + m.amount, 0);

    // Get all escrows where user is client
    const clientEscrows = await prisma.escrow.findMany({
      where: { clientWallet: wallet }
    });

    const clientEscrowIds = clientEscrows.map(e => e.id);

    // Get all APPROVED milestones for these escrows
    const clientMilestones = await prisma.milestone.findMany({
      where: {
        escrowId: { in: clientEscrowIds },
        status: 'APPROVED'
      },
      orderBy: { approvedAt: 'desc' }
    });

    // Attach escrow data to milestones
    const clientMilestonesWithEscrow = clientMilestones.map(m => ({
      ...m,
      escrow: clientEscrows.find(e => e.id === m.escrowId)
    }));

    // Calculate total spending
    const totalSpending = clientMilestones.reduce((sum, m) => sum + m.amount, 0);

    // Get all milestones created by client (all statuses)
    const milestonesCreated = await prisma.milestone.count({
      where: {
        escrowId: { in: clientEscrowIds }
      }
    });

    // Get completed milestones as freelancer
    const milestonesCompleted = freelancerMilestones.length;

    // Get reviews received
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
          reviewer: {
            walletAddress: review.reviewerWallet,
            username: reviewer?.username || null,
            role: reviewer?.role || 'CLIENT'
          }
        };
      })
    );

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 5.0;

    // Build transaction history - show BOTH client and freelancer transactions
    const allTransactions = [
      // Freelancer transactions (earnings)
      ...freelancerMilestonesWithEscrow.map(m => ({
        milestoneId: m.id,
        description: m.description,
        amount: m.amount,
        otherParty: m.escrow?.clientWallet || 'Unknown',
        otherPartyLabel: 'Client',
        fundingTxHash: m.fundingTxHash,
        approvalTxHash: m.approvalTxHash,
        submissionCid: m.submissionCid,
        submissionUrl: m.submissionUrl,
        approvedAt: m.approvedAt,
        type: 'EARNING'
      })),
      // Client transactions (spending)
      ...clientMilestonesWithEscrow.map(m => ({
        milestoneId: m.id,
        description: m.description,
        amount: m.amount,
        otherParty: m.escrow?.freelancerWallet || 'Unknown',
        otherPartyLabel: 'Freelancer',
        fundingTxHash: m.fundingTxHash,
        approvalTxHash: m.approvalTxHash,
        submissionCid: m.submissionCid,
        submissionUrl: m.submissionUrl,
        approvedAt: m.approvedAt,
        type: 'SPENDING'
      }))
    ].sort((a, b) => {
      // Sort by date, most recent first
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({
      ...user,
      stats: {
        totalEarnings,
        totalSpending,
        milestonesCreated,
        milestonesCompleted,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length
      },
      transactionHistory: allTransactions,
      reviews: reviewsWithInfo
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
