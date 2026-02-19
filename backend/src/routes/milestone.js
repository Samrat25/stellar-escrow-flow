import express from 'express';
import prisma from '../config/prisma.js';
import ContractService from '../services/contract.js';

const router = express.Router();

/**
 * POST /milestone/submit
 * Freelancer submits milestone
 */
router.post('/submit', async (req, res) => {
  try {
    const { milestoneId, freelancerWallet, proofUrl } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrow;

    // Validation
    if (escrow.freelancerWallet !== freelancerWallet) {
      return res.status(403).json({ error: 'Only assigned freelancer can submit' });
    }

    if (milestone.status !== 'PENDING' && milestone.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Milestone already submitted or approved' });
    }

    if (escrow.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Escrow not funded yet' });
    }

    // Check if previous milestone is approved (sequential)
    if (milestone.milestoneIndex > 0) {
      const prevMilestone = await prisma.milestone.findFirst({
        where: {
          escrowId: escrow.id,
          milestoneIndex: milestone.milestoneIndex - 1
        }
      });

      if (prevMilestone && prevMilestone.status !== 'APPROVED') {
        return res.status(400).json({ error: 'Previous milestone must be approved first' });
      }
    }

    // Call contract
    const contractService = new ContractService(escrow.contractId);
    const result = await contractService.submitMilestone(
      escrow.id,
      milestone.milestoneIndex,
      proofUrl
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Submission failed' });
    }

    // Calculate review deadline
    const reviewDeadline = new Date();
    reviewDeadline.setDate(reviewDeadline.getDate() + escrow.reviewWindowDays);

    // Update milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        proofUrl,
        submittedAt: new Date(),
        reviewDeadline,
        submissionTxHash: result.txHash
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId: escrow.id,
        milestoneId,
        txHash: result.txHash,
        txType: 'SUBMIT',
        walletAddress: freelancerWallet,
        amount: milestone.amount
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      reviewDeadline: reviewDeadline.toISOString(),
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/approve
 * Client approves milestone
 */
router.post('/approve', async (req, res) => {
  try {
    const { milestoneId, clientWallet } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrow;

    // Validation
    if (escrow.clientWallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can approve' });
    }

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone not submitted yet' });
    }

    // Call contract to release funds
    const contractService = new ContractService(escrow.contractId);
    const result = await contractService.approveMilestone(
      escrow.id,
      milestone.milestoneIndex
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Approval failed' });
    }

    // Update milestone
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
        escrowId: escrow.id,
        milestoneId,
        txHash: result.txHash,
        txType: 'APPROVE',
        walletAddress: clientWallet,
        amount: milestone.amount
      }
    });

    // Check if all milestones approved
    const allMilestones = await prisma.milestone.findMany({
      where: { escrowId: escrow.id }
    });

    const allApproved = allMilestones.every(m => m.status === 'APPROVED');

    if (allApproved) {
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      txHash: result.txHash,
      escrowCompleted: allApproved,
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /milestone/reject
 * Client rejects milestone
 */
router.post('/reject', async (req, res) => {
  try {
    const { milestoneId, clientWallet, reason } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrow;

    // Validation
    if (escrow.clientWallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can reject' });
    }

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone not submitted yet' });
    }

    // Call contract
    const contractService = new ContractService(escrow.contractId);
    const result = await contractService.rejectMilestone(
      escrow.id,
      milestone.milestoneIndex,
      reason
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Rejection failed' });
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectionTxHash: result.txHash
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId: escrow.id,
        milestoneId,
        txHash: result.txHash,
        txType: 'REJECT',
        walletAddress: clientWallet,
        metadata: JSON.stringify({ reason })
      }
    });

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Reject milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
