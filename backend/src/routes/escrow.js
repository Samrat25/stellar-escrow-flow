import express from 'express';
import prisma from '../config/prisma.js';
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

    if (clientWallet === freelancerWallet) {
      return res.status(400).json({ error: 'Client and freelancer must be different' });
    }

    if (!milestones || milestones.length === 0) {
      return res.status(400).json({ error: 'At least one milestone required' });
    }

    if (!reviewWindowDays || reviewWindowDays < 1) {
      return res.status(400).json({ error: 'Review window must be at least 1 day' });
    }

    const totalAmount = milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);

    // Ensure users exist
    await prisma.user.upsert({
      where: { walletAddress: clientWallet },
      update: {},
      create: { walletAddress: clientWallet, role: 'CLIENT' }
    });

    await prisma.user.upsert({
      where: { walletAddress: freelancerWallet },
      update: {},
      create: { walletAddress: freelancerWallet, role: 'FREELANCER' }
    });

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

    // Create escrow with milestones in transaction
    const escrow = await prisma.escrow.create({
      data: {
        contractId: contractResult.contractId,
        clientWallet,
        freelancerWallet,
        totalAmount,
        status: 'CREATED',
        reviewWindowDays,
        creationTxHash: contractResult.txHash,
        milestones: {
          create: milestones.map((m, index) => ({
            milestoneIndex: index,
            description: m.description,
            amount: parseFloat(m.amount),
            status: 'PENDING'
          }))
        }
      },
      include: {
        milestones: true
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId: escrow.id,
        txHash: contractResult.txHash,
        txType: 'CREATE',
        walletAddress: clientWallet,
        amount: totalAmount
      }
    });

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

    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.clientWallet !== clientWallet) {
      return res.status(403).json({ error: 'Only client can deposit' });
    }

    if (escrow.status !== 'CREATED') {
      return res.status(400).json({ error: 'Escrow already funded' });
    }

    // Call contract
    const contractService = new ContractService(escrow.contractId);
    const result = await contractService.depositFunds(clientWallet, escrow.totalAmount);

    if (!result.success) {
      return res.status(500).json({ error: 'Deposit failed' });
    }

    // Update escrow
    await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'FUNDED',
        fundedAt: new Date(),
        depositTxHash: result.txHash
      }
    });

    // Log transaction
    await prisma.transactionLog.create({
      data: {
        escrowId,
        txHash: result.txHash,
        txType: 'DEPOSIT',
        walletAddress: clientWallet,
        amount: escrow.totalAmount
      }
    });

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

    const escrows = await prisma.escrow.findMany({
      where: {
        OR: [
          { clientWallet: address },
          { freelancerWallet: address }
        ]
      },
      include: {
        milestones: {
          orderBy: { milestoneIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(escrows);
  } catch (error) {
    console.error('Get wallet escrows error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
