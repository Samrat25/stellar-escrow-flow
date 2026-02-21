import express from 'express';
import { getDatabase } from '../config/database.js';
import { isValidStellarAddress } from '../config/stellar.js';
import { verifyWallet, verifyMode, logAccess } from '../middleware/role-auth.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * GET /escrow/list
 * Get escrows based on wallet address and mode
 * STRICT: Mode-based filtering enforced
 */
router.get('/list', verifyWallet, verifyMode, logAccess('LIST_ESCROWS'), async (req, res) => {
  try {
    const { address, mode } = req.query;

    // Wallet and mode already verified by middleware
    // Filter escrows based on mode
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

    res.json(escrows);
  } catch (error) {
    console.error('List escrows error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /escrow/:id
 * Get single escrow details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const escrow = await prisma.escrow.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { milestoneIndex: 'asc' }
        }
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    res.json(escrow);
  } catch (error) {
    console.error('Get escrow error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
