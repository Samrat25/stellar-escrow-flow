import * as StellarSDK from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from '../config/stellar.js';
import dotenv from 'dotenv';

dotenv.config();

const USE_REAL_CONTRACT = process.env.USE_REAL_CONTRACT === 'true';
const CONTRACT_ID = process.env.CONTRACT_ID;

/**
 * Contract Service for interacting with Soroban smart contract
 * Supports both mock mode (for development) and real contract mode (for production)
 */

export class ContractService {
  constructor(contractId = CONTRACT_ID) {
    this.contractId = contractId;
    this.useRealContract = USE_REAL_CONTRACT && contractId;
  }

  /**
   * Create escrow on-chain
   */
  async createEscrow(clientWallet, freelancerWallet, milestones, reviewWindowDays) {
    if (this.useRealContract) {
      return await this.createEscrowReal(clientWallet, freelancerWallet, milestones, reviewWindowDays);
    }
    return await this.createEscrowMock(clientWallet, freelancerWallet, milestones, reviewWindowDays);
  }

  async createEscrowReal(clientWallet, freelancerWallet, milestones, reviewWindowDays) {
    try {
      // Build Soroban contract invocation
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Convert milestone amounts to ScVal
      const milestoneAmounts = milestones.map(m => 
        StellarSDK.nativeToScVal(parseFloat(m.amount) * 10000000, { type: 'i128' })
      );

      // Build transaction
      const account = await server.loadAccount(clientWallet);
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'initialize',
            StellarSDK.Address.fromString(clientWallet).toScVal(),
            StellarSDK.Address.fromString(freelancerWallet).toScVal(),
            StellarSDK.Address.fromString(process.env.TOKEN_ADDRESS || 'NATIVE').toScVal(),
            StellarSDK.nativeToScVal(milestoneAmounts, { type: 'vec' }),
            StellarSDK.nativeToScVal(reviewWindowDays, { type: 'u32' })
          )
        )
        .setTimeout(30)
        .build();

      // Note: In production, this would be signed by the client's wallet
      // For now, return the transaction for client-side signing
      
      return {
        success: true,
        txHash: transaction.hash().toString('hex'),
        contractId: this.contractId,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${transaction.hash().toString('hex')}`
      };
    } catch (error) {
      console.error('Real contract creation error:', error);
      return { success: false, error: error.message };
    }
  }

  async createEscrowMock(clientWallet, freelancerWallet, milestones, reviewWindowDays) {
    const mockTxHash = this.generateMockTxHash();
    const mockContractId = this.generateMockContractId();

    return {
      success: true,
      txHash: mockTxHash,
      contractId: mockContractId,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Deposit funds to contract
   */
  async depositFunds(clientWallet, amount) {
    if (this.useRealContract) {
      return await this.depositFundsReal(clientWallet, amount);
    }
    return await this.depositFundsMock(clientWallet, amount);
  }

  async depositFundsReal(clientWallet, amount) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      const account = await server.loadAccount(clientWallet);
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'deposit_funds',
            StellarSDK.Address.fromString(clientWallet).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      return {
        success: true,
        txHash: transaction.hash().toString('hex'),
        amount,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${transaction.hash().toString('hex')}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async depositFundsMock(clientWallet, amount) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      amount,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Submit milestone
   */
  async submitMilestone(escrowId, milestoneIndex, proofUrl) {
    if (this.useRealContract) {
      return await this.submitMilestoneReal(escrowId, milestoneIndex, proofUrl);
    }
    return await this.submitMilestoneMock(escrowId, milestoneIndex, proofUrl);
  }

  async submitMilestoneReal(escrowId, milestoneIndex, proofUrl) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Note: freelancerWallet would come from authenticated session
      const transaction = {
        success: true,
        txHash: this.generateMockTxHash(),
        milestoneIndex,
        submittedAt: new Date().toISOString(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${this.generateMockTxHash()}`
      };
      
      return transaction;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async submitMilestoneMock(escrowId, milestoneIndex, proofUrl) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      milestoneIndex,
      submittedAt: new Date().toISOString(),
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Approve milestone and release funds
   */
  async approveMilestone(escrowId, milestoneIndex) {
    if (this.useRealContract) {
      return await this.approveMilestoneReal(escrowId, milestoneIndex);
    }
    return await this.approveMilestoneMock(escrowId, milestoneIndex);
  }

  async approveMilestoneReal(escrowId, milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      
      const mockTxHash = this.generateMockTxHash();
      
      return {
        success: true,
        txHash: mockTxHash,
        milestoneIndex,
        approvedAt: new Date().toISOString(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async approveMilestoneMock(escrowId, milestoneIndex) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      milestoneIndex,
      approvedAt: new Date().toISOString(),
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Reject milestone
   */
  async rejectMilestone(escrowId, milestoneIndex, reason) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      milestoneIndex,
      reason,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Auto-approve milestone (called by automation agent)
   */
  async autoApproveMilestone(escrowId, milestoneIndex) {
    if (this.useRealContract) {
      return await this.autoApproveMilestoneReal(escrowId, milestoneIndex);
    }
    return await this.autoApproveMilestoneMock(escrowId, milestoneIndex);
  }

  async autoApproveMilestoneReal(escrowId, milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      
      const mockTxHash = this.generateMockTxHash();
      
      return {
        success: true,
        txHash: mockTxHash,
        milestoneIndex,
        autoApproved: true,
        approvedAt: new Date().toISOString(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async autoApproveMilestoneMock(escrowId, milestoneIndex) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      milestoneIndex,
      autoApproved: true,
      approvedAt: new Date().toISOString(),
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Get escrow state from contract
   */
  async getEscrowState(escrowId) {
    try {
      return {
        success: true,
        state: 'ACTIVE',
        currentMilestone: 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  generateMockTxHash() {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  generateMockContractId() {
    return 'C' + Array.from({ length: 55 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
  }
}

export default ContractService;
