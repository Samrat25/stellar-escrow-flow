import express from 'express';
import { supabase } from '../config/supabase.js';
import ContractService from '../services/contract.js';
import { isValidStellarAddress } from '../config/stellar.js';

const router = express.Router();

/**
 * POST /escrow/create
 * Create new escrow agreement
 */
router.post('/create', async (req, res) => {
  try {
    const { clientWallet, freelancerWallet, milestones, reviewWindowDays } = req.body;

    // Validation
    if (!isValidStellarAddress(clientWallet) || !isValidStellarAddress(freelancerWallet)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (!milestones || milestones.length === 0) {
      return res.status(400).json({ error: 'At least one milestone required' });
    }

    if (!reviewWindowDays || reviewWindowDays < 1) {
      return res.status(400).json({ error: 'Review window must be at least 1 day' });
    }

    const totalAmount = milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);

    // Deploy contract
    const contractService = new ContractService();
    const contractResult = await contractService.createEscrow(
      clientWallet,
      freelancerWallet,
      milestones,
      reviewWindowDays
    );

    if (!contractResult.success) {
      return res.status(500).json({ error: 'Contract deployment failed' });
    }

    // Store in database
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .insert({
        contract_id: contractResult.contractId,
        client_wallet: clientWallet,
        freelancer_wallet: freelancerWallet,
        total_amount: totalAmount,
        status: 'CREATED',
        review_window_days: reviewWindowDays,
        creation_tx_hash: contractResult.txHash
      })
      .select()
      .single();

    if (escrowError) throw escrowError;

    // Store milestones
    const milestonesData = milestones.map((m, index) => ({
      escrow_id: escrow.id,
      milestone_index: index,
      description: m.description,
      amount: parseFloat(m.amount),
      status: 'PENDING'
    }));

    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestonesData);

    if (milestonesError) throw milestonesError;

    res.json({
      success: true,
      escrowId: escrow.id,
      contractId: contractResult.contractId,
      txHash: contractResult.txHash,
      explorerUrl: contractResult.explorerUrl
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /escrow/deposit
 * Deposit funds to contract
 */
router.post('/deposit', async (req, res) => {
  try {
    const { escrowId, clientWallet } = req.body;

    // Get escrow
    const { data: escrow, error: fetchError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (fetchError || !escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.client_wallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can deposit' });
    }

    if (escrow.status !== 'CREATED') {
      return res.status(400).json({ error: 'Escrow already funded' });
    }

    // Call contract
    const contractService = new ContractService(escrow.contract_id);
    const result = await contractService.depositFunds(clientWallet, escrow.total_amount);

    if (!result.success) {
      return res.status(500).json({ error: 'Deposit failed' });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('escrows')
      .update({ 
        status: 'FUNDED',
        funded_at: new Date().toISOString(),
        deposit_tx_hash: result.txHash
      })
      .eq('id', escrowId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /escrow/:id
 * Get escrow details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', id)
      .single();

    if (escrowError || !escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .eq('escrow_id', id)
      .order('milestone_index');

    if (milestonesError) throw milestonesError;

    res.json({
      ...escrow,
      milestones
    });
  } catch (error) {
    console.error('Get escrow error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /escrow/wallet/:address
 * Get all escrows for a wallet
 */
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isValidStellarAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const { data: escrows, error } = await supabase
      .from('escrows')
      .select(`
        *,
        milestones (*)
      `)
      .or(`client_wallet.eq.${address},freelancer_wallet.eq.${address}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(escrows);
  } catch (error) {
    console.error('Get wallet escrows error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
