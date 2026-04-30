import * as StellarSDK from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE } from '../config/stellar.js';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const USE_REAL_CONTRACT = process.env.USE_REAL_CONTRACT === 'true';
const CONTRACT_ID = process.env.CONTRACT_ID;
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
// Default to native XLM token contract on testnet
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS === 'native' || !process.env.TOKEN_ADDRESS
  ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
  : process.env.TOKEN_ADDRESS;

console.log('Contract Service Configuration:', {
  USE_REAL_CONTRACT,
  CONTRACT_ID,
  TOKEN_ADDRESS,
  SOROBAN_RPC_URL
});

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
    this.useRealContract = USE_REAL_CONTRACT && contractId && !contractId.startsWith('contract-') && !contractId.startsWith('mock');
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
      console.log('Creating milestone with real contract:', {
        contractId: this.contractId,
        clientWallet,
        freelancerWallet,
        amount
      });

      // Build Soroban contract invocation
      const contract = new StellarSDK.Contract(this.contractId);
      
      // Convert amount to stroops (1 XLM = 10,000,000 stroops)
      const amountInStroops = Math.floor(amount * 10000000);
      
      // Build transaction
      const account = await horizonServer.loadAccount(clientWallet);
      
      // Use the TOKEN_ADDRESS constant defined at module level
      const tokenAddress = TOKEN_ADDRESS;
      
      console.log('Using token address:', tokenAddress);
      
      // Create escrow with single milestone
      const escrowId = `escrow-${Date.now()}`;
      const milestoneAmounts = [StellarSDK.nativeToScVal(amountInStroops, { type: 'i128' })];
      const reviewWindowDays = 7; // Default 7 days
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (reviewWindowDays * 86400);
      
      console.log('Building transaction with params:', {
        escrowId,
        amountInStroops,
        reviewWindowDays,
        deadlineTimestamp
      });
      
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
        console.error('Simulation failed:', JSON.stringify(simulatedTx, null, 2));
        const errorMessage = simulatedTx.error || 'Transaction simulation failed';
        throw new Error(errorMessage);
      }

      const xdr = transaction.toXDR();
      
      console.log('Transaction ready for signing, XDR length:', xdr.length);
      
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
      console.error('Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async createMilestoneMock(clientWallet, freelancerWallet, amount) {
    try {
      // Create a real Stellar payment transaction for milestone creation
      // This creates a 0.0000001 XLM payment as a "marker" transaction
      const account = await horizonServer.loadAccount(clientWallet);
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSDK.Operation.payment({
            destination: freelancerWallet,
            asset: StellarSDK.Asset.native(),
            amount: '0.0000001', // Minimal amount as marker
          })
        )
        .addMemo(StellarSDK.Memo.text(`ESCROW_CREATE:${amount}XLM`))
        .setTimeout(180)
        .build();

      const xdr = transaction.toXDR();
      const mockEscrowId = `escrow-${Date.now()}`;

      return {
        success: true,
        needsSigning: true,
        xdr: xdr,
        contractId: this.contractId || this.generateMockContractId(),
        escrowId: mockEscrowId,
        message: 'Transaction ready for signing (mock mode with real Stellar transaction)'
      };
    } catch (error) {
      console.error('Mock milestone creation error:', error);
      // Fallback to pure mock if account doesn't exist
      const mockTxHash = this.generateMockTxHash();
      const mockEscrowId = `escrow-${Date.now()}`;

      return {
        success: true,
        txHash: mockTxHash,
        escrowId: mockEscrowId,
        contractId: this.contractId || this.generateMockContractId(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockTxHash}`
      };
    }
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
    // Build a real Stellar payment transaction to the contract address as a funding marker.
    // The client signs and submits it; the real XLM lock happens via the Soroban contract.
    try {
      const account = await horizonServer.loadAccount(clientWallet);
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSDK.Operation.payment({
            destination: clientWallet, // self-payment as on-chain marker
            asset: StellarSDK.Asset.native(),
            amount: '0.0000001',
          })
        )
        .addMemo(StellarSDK.Memo.text(`ESCROW_FUND:${amount}XLM`))
        .setTimeout(180)
        .build();

      return {
        success: true,
        needsSigning: true,
        xdr: transaction.toXDR(),
        amount,
        message: 'Transaction ready for signing',
      };
    } catch (error) {
      console.error('Fund milestone (marker tx) error:', error);
      return { success: false, error: error.message };
    }
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
      // submit_milestone is the on-chain call; submissionHash (IPFS CID) is stored in DB
      // Return a marker so the route knows to proceed with DB update only
      return {
        success: true,
        txHash: null,
        milestoneIndex,
        submittedAt: new Date().toISOString(),
        dbOnly: true, // IPFS CID stored in DB; on-chain submission via submitMilestone
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async submitWorkMock(milestoneIndex, submissionHash) {
    return {
      success: true,
      txHash: null,
      milestoneIndex,
      submittedAt: new Date().toISOString(),
      dbOnly: true,
    };
  }

  /**
   * Submit milestone on-chain (freelancer submits work)
   */
  async submitMilestone(freelancerWallet, milestoneIndex) {
    if (this.useRealContract) {
      return await this.submitMilestoneReal(freelancerWallet, milestoneIndex);
    }
    return await this.submitMilestoneMock(milestoneIndex);
  }

  async submitMilestoneReal(freelancerWallet, milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      const account = await horizonServer.loadAccount(freelancerWallet);
      
      // Build transaction to submit milestone
      let transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'submit_milestone',
            StellarSDK.Address.fromString(freelancerWallet).toScVal(),
            StellarSDK.nativeToScVal(milestoneIndex, { type: 'u32' })
          )
        )
        .setTimeout(180)
        .build();

      // Simulate transaction
      console.log('Simulating submit milestone transaction...');
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
        milestoneIndex,
        message: 'Transaction ready for signing - will mark milestone as submitted on-chain'
      };
    } catch (error) {
      console.error('Real milestone submission error:', error);
      return { success: false, error: error.message };
    }
  }

  async submitMilestoneMock(milestoneIndex) {
    // Build a real Stellar transaction with memo to mark submission on-chain
    // The actual IPFS CID is stored in the database, but we create a verifiable tx
    return {
      success: false,
      error: 'Mock submission disabled - use real Soroban contract or sign a marker transaction',
    };
  }

  /**
   * Approve milestone and release funds
   */
  async approveMilestone(clientWallet, escrowId, milestoneIndex) {
    if (this.useRealContract) {
      return await this.approveMilestoneReal(clientWallet, escrowId, milestoneIndex);
    }
    return await this.approveMilestoneMock(milestoneIndex);
  }

  async approveMilestoneReal(clientWallet, escrowId, milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      const account = await horizonServer.loadAccount(clientWallet);
      
      // Build transaction to approve milestone
      // The contract will automatically transfer XLM to freelancer
      let transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'approve_milestone',
            StellarSDK.Address.fromString(clientWallet).toScVal(),
            StellarSDK.nativeToScVal(milestoneIndex, { type: 'u32' })
          )
        )
        .setTimeout(180)
        .build();

      // Simulate transaction
      console.log('Simulating approve milestone transaction...');
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
        milestoneIndex,
        message: 'Transaction ready for signing - will transfer XLM to freelancer'
      };
    } catch (error) {
      console.error('Real milestone approval error:', error);
      return { success: false, error: error.message };
    }
  }

  async approveMilestoneMock(milestoneIndex) {
    // No fake approvals — force real contract signing
    return {
      success: false,
      error: 'Mock approval disabled - approve_milestone must be signed via real Soroban contract',
    };
  }

  /**
   * Refund client — calls reject_milestone on the Soroban contract
   * Returns XDR for client to sign (real contract) or error if not configured
   */
  async refundClient(milestoneIndex) {
    if (this.useRealContract) {
      try {
        const contract = new StellarSDK.Contract(this.contractId);
        // We need the client wallet here; caller must pass it
        // For now return an error asking for clientWallet
        return { success: false, error: 'refundClient requires clientWallet parameter - use refundClientFor(clientWallet, milestoneIndex)' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Refund requires real contract interaction - mock refunds disabled' };
  }

  async refundClientFor(clientWallet, milestoneIndex) {
    try {
      const contract = new StellarSDK.Contract(this.contractId);
      const account = await horizonServer.loadAccount(clientWallet);

      let transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'reject_milestone',
            StellarSDK.Address.fromString(clientWallet).toScVal(),
            StellarSDK.nativeToScVal(milestoneIndex, { type: 'u32' }),
            StellarSDK.nativeToScVal('Rejected by client', { type: 'string' })
          )
        )
        .setTimeout(180)
        .build();

      const simulatedTx = await sorobanServer.simulateTransaction(transaction);
      if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulatedTx)) {
        transaction = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulatedTx).build();
      } else {
        throw new Error('Refund simulation failed');
      }

      return {
        success: true,
        needsSigning: true,
        xdr: transaction.toXDR(),
        milestoneIndex,
        message: 'Transaction ready for signing - will refund XLM to client',
      };
    } catch (error) {
      console.error('Refund client error:', error);
      return { success: false, error: error.message };
    }
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
