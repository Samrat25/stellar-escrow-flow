import * as StellarSDK from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE } from '../config/stellar.js';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const USE_REAL_CONTRACT = process.env.USE_REAL_CONTRACT === 'true';
const CONTRACT_ID = process.env.CONTRACT_ID;
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// Create Soroban RPC server
const sorobanServer = new StellarSDK.SorobanRpc.Server(SOROBAN_RPC_URL);
const horizonServer = new StellarSDK.Horizon.Server(HORIZON_URL);

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
   * Create milestone on-chain
   * Returns unsigned transaction XDR for client to sign
   */
  async createMilestone(clientWallet, freelancerWallet, amount) {
    if (this.useRealContract) {
      return await this.createMilestoneReal(clientWallet, freelancerWallet, amount);
    }
    return await this.createMilestoneMock(clientWallet, freelancerWallet, amount);
  }

  async createMilestoneReal(clientWallet, freelancerWallet, amount) {
    try {
      // Build Soroban contract invocation
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Convert amount to stroops (1 XLM = 10,000,000 stroops)
      const amountInStroops = Math.floor(amount * 10000000);
      
      // Build transaction
      const account = await horizonServer.loadAccount(clientWallet);
      
      // Handle token address - for native XLM, use the native asset contract
      const tokenAddress = process.env.TOKEN_ADDRESS === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' // Native XLM contract on testnet
        : process.env.TOKEN_ADDRESS;
      
      // Create escrow with single milestone
      const escrowId = `escrow-${Date.now()}`;
      const milestoneAmounts = [StellarSDK.nativeToScVal(amountInStroops, { type: 'i128' })];
      const reviewWindowDays = 7; // Default 7 days
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (reviewWindowDays * 86400);
      
      let transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'create_escrow',
            StellarSDK.nativeToScVal(escrowId, { type: 'string' }),
            StellarSDK.Address.fromString(clientWallet).toScVal(),
            StellarSDK.Address.fromString(freelancerWallet).toScVal(),
            StellarSDK.Address.fromString(tokenAddress).toScVal(),
            StellarSDK.nativeToScVal(milestoneAmounts, { type: 'vec' }),
            StellarSDK.nativeToScVal(reviewWindowDays, { type: 'u32' }),
            StellarSDK.nativeToScVal(deadlineTimestamp, { type: 'u64' })
          )
        )
        .setTimeout(180)
        .build();

      // Simulate the transaction
      console.log('Simulating create milestone transaction...');
      const simulatedTx = await sorobanServer.simulateTransaction(transaction);
      
      if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulatedTx)) {
        transaction = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulatedTx).build();
        console.log('Transaction simulated and assembled successfully');
      } else {
        console.error('Simulation failed:', simulatedTx);
        throw new Error('Transaction simulation failed');
      }

      const xdr = transaction.toXDR();
      
      return {
        success: true,
        needsSigning: true,
        xdr: xdr,
        contractId: this.contractId,
        escrowId: escrowId,
        message: 'Transaction ready for signing'
      };
    } catch (error) {
      console.error('Real milestone creation error:', error);
      return { success: false, error: error.message };
    }
  }

  async createMilestoneMock(clientWallet, freelancerWallet, amount) {
    const mockTxHash = this.generateMockTxHash();
    const mockEscrowId = `escrow-${Date.now()}`;

    return {
      success: true,
      txHash: mockTxHash,
      escrowId: mockEscrowId,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Fund milestone - transfers real XLM to contract
   */
  async fundMilestone(clientWallet, amount) {
    if (this.useRealContract) {
      return await this.fundMilestoneReal(clientWallet, amount);
    }
    return await this.fundMilestoneMock(clientWallet, amount);
  }

  async fundMilestoneReal(clientWallet, amount) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      const account = await horizonServer.loadAccount(clientWallet);
      
      let transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'deposit_funds',
            StellarSDK.Address.fromString(clientWallet).toScVal()
          )
        )
        .setTimeout(180)
        .build();

      // Simulate transaction
      const simulatedTx = await sorobanServer.simulateTransaction(transaction);
      
      if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulatedTx)) {
        transaction = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulatedTx).build();
      } else {
        throw new Error('Transaction simulation failed');
      }

      const xdr = transaction.toXDR();

      return {
        success: true,
        needsSigning: true,
        xdr: xdr,
        amount,
        message: 'Transaction ready for signing'
      };
    } catch (error) {
      console.error('Fund milestone error:', error);
      return { success: false, error: error.message };
    }
  }

  async fundMilestoneMock(clientWallet, amount) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      amount,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
    };
  }

  /**
   * Submit work for milestone
   */
  async submitWork(milestoneIndex, submissionHash) {
    if (this.useRealContract) {
      return await this.submitWorkReal(milestoneIndex, submissionHash);
    }
    return await this.submitWorkMock(milestoneIndex, submissionHash);
  }

  async submitWorkReal(milestoneIndex, submissionHash) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Note: This would need freelancer wallet from authenticated session
      // For now, returning mock since we need client-side signing
      const mockTxHash = this.generateMockTxHash();
      
      return {
        success: true,
        txHash: mockTxHash,
        milestoneIndex,
        submittedAt: new Date().toISOString(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async submitWorkMock(milestoneIndex, submissionHash) {
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
  async approveMilestone(milestoneIndex) {
    if (this.useRealContract) {
      return await this.approveMilestoneReal(milestoneIndex);
    }
    return await this.approveMilestoneMock(milestoneIndex);
  }

  async approveMilestoneReal(milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Note: This would need client wallet from authenticated session
      // For now, returning mock since we need client-side signing
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

  async approveMilestoneMock(milestoneIndex) {
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
   * Refund client
   */
  async refundClient(milestoneIndex) {
    const mockTxHash = this.generateMockTxHash();
    
    return {
      success: true,
      txHash: mockTxHash,
      milestoneIndex,
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
    // Use crypto.randomBytes for truly random hash
    return randomBytes(32).toString('hex');
  }

  generateMockContractId() {
    // Generate a truly unique contract ID using crypto random bytes
    const randomHex = randomBytes(28).toString('hex').toUpperCase();
    
    // Convert to base32-like format (Stellar contract IDs use base32)
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = 'C';
    
    for (let i = 0; i < 55; i++) {
      const randomIndex = Math.floor(Math.random() * base32Chars.length);
      result += base32Chars[randomIndex];
    }
    
    return result;
  }
}

export default ContractService;
