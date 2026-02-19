import express from 'express';
import { supabase } from '../config/supabase.js';
import ContractService from '../services/contract.js';

const router = express.Router();

/**
 * POST /milestone/submit
 * Freelancer submits milestone
 */
router.post('/submit', async (req, res) => {
  try {
    const { milestoneId, freelancerWallet, proofUrl } = req.body;

    // Get milestone and escrow
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*, escrows(*)')
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrows;

    // Validation
    if (escrow.freelancer_wallet !== freelancerWallet) {
      return res.status(403).json({ error: 'Only assigned freelancer can submit' });
    }

    if (milestone.status !== 'PENDING' && milestone.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Milestone already submitted or approved' });
    }

    if (escrow.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Escrow not funded yet' });
    }

    // Check if previous milestone is approved (sequential)
    if (milestone.milestone_index > 0) {
      const { data: prevMilestone } = await supabase
        .from('milestones')
        .select('status')
        .eq('escrow_id', escrow.id)
        .eq('milestone_index', milestone.milestone_index - 1)
        .single();

      if (prevMilestone && prevMilestone.status !== 'APPROVED') {
        return res.status(400).json({ error: 'Previous milestone must be approved first' });
      }
    }

    // Call contract
    const contractService = new ContractService(escrow.contract_id);
    const result = await contractService.submitMilestone(
      escrow.id,
      milestone.milestone_index,
      proofUrl
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Submission failed' });
    }

    // Calculate review deadline
    const reviewDeadline = new Date();
    reviewDeadline.setDate(reviewDeadline.getDate() + escrow.review_window_days);

    // Update milestone
    const { error: updateError } = await supabase
      .from('milestones')
      .update({
        status: 'SUBMITTED',
        proof_url: proofUrl,
        submitted_at: new Date().toISOString(),
        review_deadline: reviewDeadline.toISOString(),
        submission_tx_hash: result.txHash
      })
      .eq('id', milestoneId);

    if (updateError) throw updateError;

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

    // Get milestone and escrow
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*, escrows(*)')
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrows;

    // Validation
    if (escrow.client_wallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can approve' });
    }

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone not submitted yet' });
    }

    // Call contract to release funds
    const contractService = new ContractService(escrow.contract_id);
    const result = await contractService.approveMilestone(
      escrow.id,
      milestone.milestone_index
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Approval failed' });
    }

    // Update milestone
    const { error: updateError } = await supabase
      .from('milestones')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
        approval_tx_hash: result.txHash
      })
      .eq('id', milestoneId);

    if (updateError) throw updateError;

    // Check if all milestones approved
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('status')
      .eq('escrow_id', escrow.id);

    const allApproved = allMilestones.every(m => m.status === 'APPROVED');

    if (allApproved) {
      await supabase
        .from('escrows')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', escrow.id);
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

    // Get milestone and escrow
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*, escrows(*)')
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const escrow = milestone.escrows;

    // Validation
    if (escrow.client_wallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can reject' });
    }

    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Milestone not submitted yet' });
    }

    // Call contract
    const contractService = new ContractService(escrow.contract_id);
    const result = await contractService.rejectMilestone(
      escrow.id,
      milestone.milestone_index,
      reason
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Rejection failed' });
    }

    // Update milestone
    const { error: updateError } = await supabase
      .from('milestones')
      .update({
        status: 'REJECTED',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejection_tx_hash: result.txHash
      })
      .eq('id', milestoneId);

    if (updateError) throw updateError;

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
