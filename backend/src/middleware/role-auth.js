import { isValidStellarAddress } from '../config/stellar.js';

/**
 * STRICT ROLE-BASED AUTHENTICATION MIDDLEWARE
 * Enforces mode-based access control for all milestone operations
 */

/**
 * Verify wallet address is provided and valid
 */
export const verifyWallet = (req, res, next) => {
  const wallet = req.body.clientWallet || req.body.freelancerWallet || req.body.walletAddress || req.query.address;
  
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  if (!isValidStellarAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid Stellar wallet address' });
  }

  req.wallet = wallet;
  next();
};

/**
 * Verify mode is provided and valid
 */
export const verifyMode = (req, res, next) => {
  const mode = req.body.mode || req.query.mode;
  
  if (!mode) {
    return res.status(400).json({ error: 'Mode required (BUYING or SELLING)' });
  }

  if (mode !== 'BUYING' && mode !== 'SELLING') {
    return res.status(400).json({ error: 'Invalid mode. Must be BUYING or SELLING' });
  }

  req.mode = mode;
  next();
};

/**
 * Verify user is in BUYING mode (client actions)
 */
export const requireBuyingMode = (req, res, next) => {
  const mode = req.body.mode || req.query.mode;
  
  if (mode !== 'BUYING') {
    return res.status(403).json({ 
      error: 'Access denied. Switch to BUYING mode to perform this action.',
      requiredMode: 'BUYING',
      currentMode: mode
    });
  }

  next();
};

/**
 * Verify user is in SELLING mode (freelancer actions)
 */
export const requireSellingMode = (req, res, next) => {
  const mode = req.body.mode || req.query.mode;
  
  if (mode !== 'SELLING') {
    return res.status(403).json({ 
      error: 'Access denied. Switch to SELLING mode to perform this action.',
      requiredMode: 'SELLING',
      currentMode: mode
    });
  }

  next();
};

/**
 * Verify client ownership of milestone
 * Used for: fund, approve, refund actions
 */
export const verifyClientOwnership = async (req, res, next) => {
  try {
    const { getDatabase } = await import('../config/database.js');
    const prisma = getDatabase();
    const { milestoneId, clientWallet } = req.body;

    if (!milestoneId || !clientWallet) {
      return res.status(400).json({ error: 'Milestone ID and client wallet required' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.escrow.clientWallet !== clientWallet) {
      return res.status(403).json({ 
        error: 'Access denied. You are not the client of this milestone.',
        action: 'CLIENT_ONLY'
      });
    }

    req.milestone = milestone;
    next();
  } catch (error) {
    console.error('Client ownership verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Verify freelancer assignment to milestone
 * Used for: submit work action
 */
export const verifyFreelancerAssignment = async (req, res, next) => {
  try {
    const { getDatabase } = await import('../config/database.js');
    const prisma = getDatabase();
    const { milestoneId, freelancerWallet } = req.body;

    if (!milestoneId || !freelancerWallet) {
      return res.status(400).json({ error: 'Milestone ID and freelancer wallet required' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.escrow.freelancerWallet !== freelancerWallet) {
      return res.status(403).json({ 
        error: 'Access denied. You are not the assigned freelancer for this milestone.',
        action: 'FREELANCER_ONLY'
      });
    }

    req.milestone = milestone;
    next();
  } catch (error) {
    console.error('Freelancer assignment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Verify user is either client or freelancer (for dispute)
 */
export const verifyParticipant = async (req, res, next) => {
  try {
    const { getDatabase } = await import('../config/database.js');
    const prisma = getDatabase();
    const { milestoneId, walletAddress } = req.body;

    if (!milestoneId || !walletAddress) {
      return res.status(400).json({ error: 'Milestone ID and wallet address required' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const isClient = milestone.escrow.clientWallet === walletAddress;
    const isFreelancer = milestone.escrow.freelancerWallet === walletAddress;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ 
        error: 'Access denied. You are not a participant in this milestone.',
        action: 'PARTICIPANT_ONLY'
      });
    }

    req.milestone = milestone;
    req.isClient = isClient;
    req.isFreelancer = isFreelancer;
    next();
  } catch (error) {
    console.error('Participant verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Log access attempts for security auditing
 */
export const logAccess = (action) => {
  return (req, res, next) => {
    const wallet = req.body.clientWallet || req.body.freelancerWallet || req.body.walletAddress || req.query.address;
    const mode = req.body.mode || req.query.mode;
    
    console.log(`[ACCESS] ${action} - Wallet: ${wallet?.slice(0, 8)}... - Mode: ${mode} - IP: ${req.ip}`);
    next();
  };
};
