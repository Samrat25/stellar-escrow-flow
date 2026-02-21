import { getDatabase } from '../config/database.js';
import { isValidStellarAddress } from '../config/stellar.js';

const prisma = getDatabase();

/**
 * Verify wallet and mode
 */
export const verifyWalletAndMode = async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress || req.body.clientWallet || req.body.freelancerWallet || req.params.address;
    const mode = req.body.mode || req.query.mode || req.headers['x-mode'];

    if (!walletAddress || !isValidStellarAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (!mode || !['BUYING', 'SELLING'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be BUYING or SELLING' });
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress }
      });
    }

    req.user = user;
    req.walletAddress = walletAddress;
    req.mode = mode;
    next();
  } catch (error) {
    console.error('Wallet and mode verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Verify buyer action (BUYING mode only)
 */
export const verifyBuyerAction = async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress || req.body.clientWallet;
    const mode = req.body.mode || req.query.mode || req.headers['x-mode'];

    if (mode !== 'BUYING') {
      return res.status(403).json({ error: 'This action requires BUYING mode' });
    }

    next();
  } catch (error) {
    console.error('Buyer action verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Verify seller action (SELLING mode only)
 */
export const verifySellerAction = async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress || req.body.freelancerWallet;
    const mode = req.body.mode || req.query.mode || req.headers['x-mode'];

    if (mode !== 'SELLING') {
      return res.status(403).json({ error: 'This action requires SELLING mode' });
    }

    next();
  } catch (error) {
    console.error('Seller action verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Verify escrow ownership based on mode
 */
export const verifyEscrowAccess = async (req, res, next) => {
  try {
    const { escrowId, walletAddress, mode } = req.body;

    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Verify access based on mode
    if (mode === 'BUYING' && escrow.clientWallet !== walletAddress) {
      return res.status(403).json({ error: 'You are not the buyer of this escrow' });
    }

    if (mode === 'SELLING' && escrow.freelancerWallet !== walletAddress) {
      return res.status(403).json({ error: 'You are not the seller of this escrow' });
    }

    req.escrow = escrow;
    next();
  } catch (error) {
    console.error('Escrow access verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};
