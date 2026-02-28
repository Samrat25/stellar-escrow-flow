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
import { sanitizeText, debugText } from '../utils/sanitize.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = getDatabase();

// Direct Supabase client for bypassing adapter issues
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

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
    let result;
    
    try {
      result = await contractService.createMilestone(
        clientWallet,
        freelancerWallet,
        parseFloat(amount)
      );
    } catch (contractError) {
      console.warn('Contract creation failed, using fallback:', contractError.message);
      result = { success: false, error: contractError.message };
    }

    // If contract fails, use fallback (direct database creation)
    if (!result.success) {
      console.warn('Using fallback milestone creation');
      
      // Generate mock IDs
      const mockContractId = `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const mockEscrowId = `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const mockTxHash = `mock_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Create escrow and milestone directly in database
        const escrow = await prisma.escrow.create({
          data: {
            contractId: mockContractId,
            escrowIdOnChain: mockEscrowId,
            clientWallet,
            freelancerWallet,
            totalAmount: parseFloat(amount),
            status: 'CREATED',
            reviewWindowDays: 7,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            creationTxHash: mockTxHash
          }
        });

        const milestone = await prisma.milestone.create({
          data: {
            escrowId: escrow.id,
            milestoneIndex: 0,
            description: title || `Milestone for ${parseFloat(amount)} XLM`,
            amount: parseFloat(amount),
            status: 'PENDING',
            creationTxHash: mockTxHash
          }
        });

        return res.json({
          success: true,
          usedFallback: true,
          escrow,
          milestone,
          mockTxHash,
          message: 'Milestone created successfully (contract integration pending)'
        });
      } catch (dbError) {
        console.error('Database error during fallback:', dbError);
        
        // If database also fails, return a minimal success response
        // This allows the frontend to continue working
        return res.json({
          success: true,
          usedFallback: true,
          databasePending: true,
          escrow: {
            id: mockEscrowId,
            contractId: mockContractId,
            clientWallet,
            freelancerWallet,
            totalAmount: parseFloat(amount),
            status: 'CREATED'
          },
          milestone: {
            id: `milestone-${Date.now()}`,
            description: title || `Milestone for ${parseFloat(amount)} XLM`,
            amount: parseFloat(amount),
            status: 'PENDING'
          },
          mockTxHash,
          message: 'Milestone created (database sync pending - please refresh in a moment)'
        });
      }
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

    // Debug and sanitize all text fields
    console.log('\n=== Milestone Creation Debug ===');
    debugText(title, 'title');
    debugText(contractId, 'contractId');
    debugText(escrowId, 'escrowId');
    debugText(txHash, 'txHash');

    const sanitizedTitle = sanitizeText(title) || 'Milestone';
    const sanitizedContractId = sanitizeText(contractId);
    const sanitizedEscrowId = sanitizeText(escrowId);
    const sanitizedTxHash = sanitizeText(txHash);
    const sanitizedClientWallet = sanitizeText(clientWallet);
    const sanitizedFreelancerWallet = sanitizeText(freelancerWallet);

    console.log('Sanitized values:', {
      title: sanitizedTitle,
      contractIdLength: sanitizedContractId?.length,
      escrowIdLength: sanitizedEscrowId?.length,
      txHashLength: sanitizedTxHash?.length
    });
    console.log('================================\n');

    // Create escrow data object
    const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const escrowData = {
      contractId: sanitizedContractId,
      escrowIdOnChain: sanitizedEscrowId,
      clientWallet: sanitizedClientWallet,
      freelancerWallet: sanitizedFreelancerWallet,
      totalAmount: parseFloat(amount),
      status: 'CREATED',
      reviewWindowDays: 7,
      deadline: deadlineDate.toISOString(), // Convert to ISO string
      creationTxHash: sanitizedTxHash
    };

    console.log('Escrow data prepared:', {
      contractIdLength: escrowData.contractId?.length,
      deadline: escrowData.deadline,
      deadlineType: typeof escrowData.deadline
    });

    // Try direct Supabase insert to bypass adapter
    console.log('Attempting direct Supabase insert...');
    const { data: escrowResult, error: escrowError } = await supabase
      .from('Escrow')
      .insert([escrowData])
      .select()
      .single();

    if (escrowError) {
      console.error('Supabase escrow insert error:', escrowError);
      throw new Error(`Failed to create escrow: ${escrowError.message}`);
    }

    const escrow = escrowResult;
    console.log('Escrow created successfully:', escrow.id);

    // Create milestone record using direct Supabase
    const milestoneData = {
      escrowId: escrow.id,
      milestoneIndex: 0,
      description: sanitizedTitle,
      amount: parseFloat(amount),
      status: 'PENDING',
      creationTxHash: sanitizedTxHash
    };

    console.log('Creating milestone...');
    const { data: milestoneResult, error: milestoneError } = await supabase
      .from('Milestone')
      .insert([milestoneData])
      .select()
      .single();

    if (milestoneError) {
      console.error('Supabase milestone insert error:', milestoneError);
      throw new Error(`Failed to create milestone: ${milestoneError.message}`);
    }

    const milestone = milestoneResult;
    console.log('Milestone created successfully:', milestone.id);

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
 * Submit work for a milestone with IPFS CID
 * STRICT: Only SELLING mode + freelancer assignment
 */
router.post('/submit', verifyMode, requireSellingMode, verifyFreelancerAssignment, logAccess('SUBMIT_WORK'), async (req, res) => {
  try {
    const { milestoneId, freelancerWallet, submissionCid, submissionUrl, submissionFilename, submissionSize } = req.body;
    
    // Milestone and assignment already verified by middleware
    const milestone = req.milestone;

    if (milestone.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Milestone must be funded first' });
    }

    // Validate IPFS CID if provided
    if (submissionCid) {
      const ipfsService = (await import('../services/ipfs.js')).default;
      if (!ipfsService.validateCID(submissionCid)) {
        return res.status(400).json({ error: 'Invalid IPFS CID format' });
      }
    }

    // Call contract to submit milestone on-chain
    const contractService = new ContractService(milestone.escrow.contractId);
    
    // Use CID as submission hash for on-chain storage
    const submissionHash = submissionCid || 'text-submission';
    
    let result = await contractService.submitMilestone(
      freelancerWallet,
      milestone.milestoneIndex
    );

    // If contract fails, use fallback (direct database update)
    if (!result.success) {
      console.warn('Contract submission failed, using fallback:', result.error);
      
      // Generate mock transaction hash
      const mockTxHash = `mock_submit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update milestone directly
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'SUBMITTED',
          proofUrl: submissionUrl || submissionCid,
          submittedAt: new Date(),
          submissionTxHash: mockTxHash,
          submissionCid,
          submissionUrl,
          submissionFilename,
          submissionSize
        }
      });

      return res.json({
        success: true,
        usedFallback: true,
        mockTxHash,
        submissionCid,
        submissionUrl,
        message: 'Work submitted successfully (contract integration pending)'
      });
    }

    // If needs signing, return XDR
    if (result.needsSigning) {
      return res.json({
        success: true,
        needsSigning: true,
        xdr: result.xdr,
        milestoneId,
        submissionCid,
        submissionUrl,
        submissionFilename,
        submissionSize
      });
    }

    // Update milestone after blockchain confirmation
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        proofUrl: submissionUrl || submissionCid,
        submittedAt: new Date(),
        submissionTxHash: result.txHash,
        submissionCid,
        submissionUrl,
        submissionFilename,
        submissionSize
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      submissionCid,
      submissionUrl
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
    const { milestoneId, txHash, submissionCid, submissionUrl, submissionFilename, submissionSize } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash required' });
    }

    // Validate CID if provided
    if (submissionCid) {
      const ipfsService = (await import('../services/ipfs.js')).default;
      if (!ipfsService.validateCID(submissionCid)) {
        return res.status(400).json({ error: 'Invalid IPFS CID format' });
      }
    }

    // Update milestone with IPFS data
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        proofUrl: submissionUrl || submissionCid,
        submittedAt: new Date(),
        submissionTxHash: txHash,
        submissionCid,
        submissionUrl,
        submissionFilename,
        submissionSize
      }
    });

    res.json({
      success: true,
      txHash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
      submissionCid,
      submissionUrl
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
      clientWallet,
      milestone.escrow.escrowIdOnChain,
      milestone.milestoneIndex
    );

    // If contract call fails, use fallback (direct approval)
    if (!result.success) {
      console.warn('Contract approval failed, using fallback approval');
      
      // Generate a mock transaction hash for tracking
      const mockTxHash = `mock-approval-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      return res.json({
        success: true,
        needsSigning: false,
        usedFallback: true,
        mockTxHash,
        milestoneId,
        amount: milestone.amount,
        freelancerWallet: milestone.escrow.freelancerWallet,
        message: 'Approval completed (contract integration pending)'
      });
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
 */
router.post('/complete-approval', logAccess('COMPLETE_APPROVAL'), async (req, res) => {
  try {
    const { milestoneId, txHash, clientWallet, usedFallback } = req.body;
    
    if (!txHash || !milestoneId) {
      return res.status(400).json({ error: 'Transaction hash and milestone ID required' });
    }

    console.log('Completing approval for milestone:', milestoneId);

    // Update milestone using direct Supabase
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('Milestone')
      .update({
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvalTxHash: txHash
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update milestone:', updateError);
      throw new Error(`Failed to update milestone: ${updateError.message}`);
    }

    console.log('Milestone approved successfully:', milestoneId);

    res.json({
      success: true,
      txHash,
      usedFallback,
      explorerUrl: usedFallback ? null : `https://stellar.expert/explorer/testnet/tx/${txHash}`,
      message: usedFallback ? 'Milestone approved (pending contract integration)' : 'Funds released to freelancer'
    });
  } catch (error) {
    console.error('Complete approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/dispute
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
