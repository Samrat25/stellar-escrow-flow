import express from 'express';
import { getDatabase } from '../config/database.js';
import { isValidStellarAddress } from '../config/stellar.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /user/:address
 * Get user details
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isValidStellarAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress: address }
    });

    if (!user) {
      // Auto-create user
      user = await prisma.user.create({
        data: { walletAddress: address }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /user/:address
 * Update user details
 */
router.put('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { displayName, email } = req.body;

    if (!isValidStellarAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { walletAddress: address },
      data: updateData
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /user/:address/dashboard
 * Get dashboard data based on mode
 */
router.get('/:address/dashboard', async (req, res) => {
  try {
    const { address } = req.params;
    const { mode } = req.query;

    if (!isValidStellarAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (!mode || !['BUYING', 'SELLING'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be BUYING or SELLING' });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress: address }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: address }
      });
    }

    // Get escrows based on mode
    const whereClause = mode === 'BUYING'
      ? { clientWallet: address }
      : { freelancerWallet: address };

    const escrows = await prisma.escrow.findMany({
      where: whereClause,
      include: {
        milestones: {
          orderBy: { milestoneIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      mode,
      escrows,
      stats: {
        totalEscrows: escrows.length,
        activeEscrows: escrows.filter(e => e.status === 'ACTIVE' || e.status === 'FUNDED').length,
        completedEscrows: escrows.filter(e => e.status === 'COMPLETED').length,
        reputation: user.reputation,
        totalTransacted: user.totalTransacted
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /user/:address/reputation
 * Get user reputation
 */
router.get('/:address/reputation', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isValidStellarAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: address }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      reputation: user.reputation,
      completedEscrows: user.completedEscrows,
      totalTransacted: user.totalTransacted
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
