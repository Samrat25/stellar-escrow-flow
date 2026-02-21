import express from 'express';
import { getDatabase } from '../config/database.js';
import ContractService from '../services/contract.js';
import { isValidStellarAddress } from '../config/stellar.js';
import {
  verifyWallet,
  verifyMode,
  requireBuyingMode,
  requireSellingMode,
  verifyClientOwnership,
  verifyFreelancerAssignment,
  verifyParticipant,
  logAccess
} from '../middleware/role-auth.js';

const router = express.Router();
const prisma = getDatabase();

/**
 * POST /milestone/create
 * Create a new milestone
 * STRICT: Only BUYING mode allowed
 */
router.post('/create', verifyMode, requireBuyingMode, logAccess('CREATE_MILESTONE'), async (req, res) => {
  try {
    const { clientWallet, freelancerWallet, amount, title, mode } = req.body;

    // Validation
    if (!isValidStellarAddress(clientWallet) || !isValidStellarAddress(freelancerWallet)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (clientWallet === freelancerWallet) {
      return res.status(400).json({ error: 'Client and freelancer must be different' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Mode already verified by middleware

    // Ensure users exist
    await prisma.user.upsert({
      where: { walletAddress: clientWallet },
      update: {},
      create: { walletAddress: clientWallet }
    });

    await prisma.user.upsert({
      where: { walletAddress: freelancerWallet },
      update: {},
      create: { walletAddress: freelancerWallet }
    });

    // Call contract to create milestone
    const contractService = new ContractService();
    const result = await contractService.createMilestone(
      clientWallet,
      freelancerWallet,
      parseFloat(amount)
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Contract call failed' });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        contractId: result.contractId,
        escrowId: result.escrowId,
        milestoneData: {
          clientWallet,
          freelancerWallet,
          amount: parseFloat(amount),
          title: title.trim()
        }
      });
    }

    // Create escrow and milestone in database after blockchain confirmation
    const escrow = await prisma.escrow.create({
      data: {
        contractId: result.contractId || `contract-${Date.now()}`,
        escrowIdOnChain: result.escrowId,
        clientWallet,
        freelancerWallet,
        totalAmount: parseFloat(amount),
        status: 'CREATED',
        reviewWindowDays: 7,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        creationTxHash: result.txHash
      }
    });

    const milestone = await prisma.milestone.create({
      data: {
        escrowId: escrow.id,
        milestoneIndex: 0,
        description: title || `Milestone for ${parseFloat(amount)} XLM`,
        amount: parseFloat(amount),
        status: 'PENDING',
        creationTxHash: result.txHash
      }
    });

    res.json({
      success: true,
      escrow,
      milestone,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/complete-creation
 * Complete milestone creation after transaction is signed
 * STRICT: Only BUYING mode allowed
 */
router.post('/complete-creation', verifyMode, requireBuyingMode, logAccess('COMPLETE_MILESTONE_CREATION'), async (req, res) => {
  try {
    const { txHash, contractId, escrowId, clientWallet, freelancerWallet, amount, title } = req.body;

    if (!txHash || !contractId || !escrowId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create escrow record
    const escrow = await prisma.escrow.create({
      data: {
        contractId,
        escrowIdOnChain: escrowId,
        clientWallet,
        freelancerWallet,
        totalAmount: parseFloat(amount),
        status: 'CREATED',
        reviewWindowDays: 7,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        creationTxHash: txHash
      }
    });

    // Create milestone record
    const milestone = await prisma.milestone.create({
      data: {
        escrowId: escrow.id,
        milestoneIndex: 0,
        description: title || `Milestone for ${parseFloat(amount)} XLM`,
        amount: parseFloat(amount),
        status: 'PENDING',
        creationTxHash: txHash
      }
    });

    res.json({
      success: true,
      escrow,
      milestone,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`
    });
  } catch (error) {
    console.error('Complete milestone creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/fund
 * Fund a milestone - transfers real XLM to contract
 * STRICT: Only BUYING mode + client ownership
 */
router.post('/fund', verifyMode, requireBuyingMode, verifyClientOwnership, logAccess('FUND_MILESTONE'), async (req, res) => {
  try {
    const { milestoneId, clientWallet } = req.body;
    
    // Milestone and ownership already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'PENDING') {
      return res.status(400).json({ error: 'Milestone already funded' });
    }

    // Call contract to fund milestone
    const contractService = new ContractService(milestone.escrow.contractId);
    const result = await contractService.fundMilestone(
      clientWallet,
      milestone.amount
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Funding failed' });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        milestoneId,
        amount: milestone.amount
      });
    }

    // Update milestone status after blockchain confirmation
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'FUNDED',
        fundingTxHash: result.txHash
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      message: `${milestone.amount} XLM locked in contract`
    });
  } catch (error) {
    console.error('Fund milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/complete-funding
 * Complete funding after transaction is confirmed
 * STRICT: Only BUYING mode + client ownership
 */
router.post('/complete-funding', verifyMode, requireBuyingMode, verifyClientOwnership, logAccess('COMPLETE_FUNDING'), async (req, res) => {
  try {
    const { milestoneId, txHash } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash required' });
    }

    // Milestone already verified by middleware
    const milestone = req.milestone;

    // Update milestone status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'FUNDED',
        fundingTxHash: txHash
      }
    });

    // Update escrow status
    await prisma.escrow.update({
      where: { id: milestone.escrowId },
      data: {
        status: 'FUNDED',
        depositTxHash: txHash,
        fundedAt: new Date()
      }
    });

    res.json({
      success: true,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
      message: 'Funding completed successfully'
    });
  } catch (error) {
    console.error('Complete funding error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/submit
 * Submit work for a milestone
 * STRICT: Only SELLING mode + freelancer assignment
 */
router.post('/submit', verifyMode, requireSellingMode, verifyFreelancerAssignment, logAccess('SUBMIT_WORK'), async (req, res) => {
  try {
    const { milestoneId, freelancerWallet, submissionHash } = req.body;
    
    // Milestone and assignment already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Milestone must be funded first' });
    }

    // Call contract to submit work
    const contractService = new ContractService(milestone.escrow.contractId);
    const result = await contractService.submitWork(
      milestone.milestoneIndex,
      submissionHash || 'work-submitted'
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Submission failed' });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        milestoneId,
        submissionHash
      });
    }

    // Update milestone after blockchain confirmation
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        proofUrl: submissionHash,
        submittedAt: new Date(),
        submissionTxHash: result.txHash
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/complete-submission
 * Complete submission after transaction is confirmed
 * STRICT: Only SELLING mode + freelancer assignment
 */
router.post('/complete-submission', verifyMode, requireSellingMode, verifyFreelancerAssignment, logAccess('COMPLETE_SUBMISSION'), async (req, res) => {
  try {
    const { milestoneId, txHash, submissionHash } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash required' });
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        proofUrl: submissionHash,
        submittedAt: new Date(),
        submissionTxHash: txHash
      }
    });

    res.json({
      success: true,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`
    });
  } catch (error) {
    console.error('Complete submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/approve
 * Approve milestone and release funds to freelancer
 * STRICT: Only BUYING mode + client ownership
 */
router.post('/approve', verifyMode, requireBuyingMode, verifyClientOwnership, logAccess('APPROVE_MILESTONE'), async (req, res) => {
  try {
    const { milestoneId, clientWallet } = req.body;
    
    // Milestone and ownership already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone not submitted yet' });
    }

    // Call contract to approve and release funds
    const contractService = new ContractService(milestone.escrow.contractId);
    const result = await contractService.approveMilestone(
      milestone.milestoneIndex
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Approval failed' });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        milestoneId,
        amount: milestone.amount,
        freelancerWallet: milestone.escrow.freelancerWallet
      });
    }

    // Update milestone after blockchain confirmation
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvalTxHash: result.txHash
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId: milestone.escrowId,
        milestoneId,
        txHash: result.txHash,
        txType: 'APPROVE',
        walletAddress: clientWallet,
        amount: milestone.amount
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      message: `${milestone.amount} XLM released to freelancer`
    });
  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/complete-approval
 * Complete approval after transaction is confirmed
 * STRICT: Only BUYING mode + client ownership
 */
router.post('/complete-approval', verifyMode, requireBuyingMode, verifyClientOwnership, logAccess('COMPLETE_APPROVAL'), async (req, res) => {
  try {
    const { milestoneId, txHash, clientWallet } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash required' });
    }

    const milestone = req.milestone;

    // Update milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvalTxHash: txHash
      }
    });

    // Update escrow
    await prisma.escrow.update({
      where: { id: milestone.escrowId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId: milestone.escrowId,
        milestoneId,
        txHash,
        txType: 'APPROVE',
        walletAddress: clientWallet,
        amount: milestone.amount
      }
    });

    res.json({
      success: true,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
      message: `${milestone.amount} XLM released to freelancer`
    });
  } catch (error) {
    console.error('Complete approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/dispute
 * Raise a dispute
 * STRICT: Only participants (client or freelancer)
 */
router.post('/dispute', verifyParticipant, logAccess('DISPUTE_MILESTONE'), async (req, res) => {
  try {
    const { milestoneId } = req.body;
    
    // Milestone and participant status already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'FUNDED' && milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Cannot dispute in current status' });
    }

    // Update milestone status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'DISPUTED'
      }
    });

    res.json({
      success: true,
      message: 'Dispute raised successfully'
    });
  } catch (error) {
    console.error('Dispute milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/refund
 * Refund client
 * STRICT: Only BUYING mode + client ownership
 */
router.post('/refund', verifyMode, requireBuyingMode, verifyClientOwnership, logAccess('REFUND_MILESTONE'), async (req, res) => {
  try {
    const { milestoneId, clientWallet } = req.body;
    
    // Milestone and ownership already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'DISPUTED') {
      return res.status(400).json({ error: 'Can only refund disputed milestones' });
    }

    // Call contract to refund
    const contractService = new ContractService(milestone.escrow.contractId);
    const result = await contractService.refundClient(milestone.milestoneIndex);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Refund failed' });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        milestoneId,
        amount: milestone.amount
      });
    }

    // Update milestone after blockchain confirmation
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'REFUNDED',
        refundTxHash: result.txHash
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      message: `${milestone.amount} XLM refunded to client`
    });
  } catch (error) {
    console.error('Refund milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /milestone/:id
 * Get milestone details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        escrow: true
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(milestone);
  } catch (error) {
    console.error('Get milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
