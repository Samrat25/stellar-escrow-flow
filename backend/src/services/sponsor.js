import * as StellarSDK from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE } from '../config/stellar.js';
import dotenv from 'dotenv';

dotenv.config();

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const sorobanServer = new StellarSDK.SorobanRpc.Server(SOROBAN_RPC_URL);
const horizonServer = new StellarSDK.Horizon.Server(HORIZON_URL);

/**
 * Service to handle Fee Sponsorship (Gasless Transactions)
 */
export class SponsorService {
  constructor() {
    this.sponsorSecret = process.env.SPONSOR_SECRET_KEY;
    this.isActive = !!this.sponsorSecret;
  }

  /**
   * Takes an inner transaction XDR (already signed by the user)
   * Wraps it in a FeeBumpTransaction and signs it with the sponsor account
   * @param {string} innerTxXdrBase64 - The XDR of the inner transaction
   * @returns {Promise<Object>} - Success status and hash
   */
  async sponsorTransaction(innerTxXdrBase64) {
    if (!this.isActive) {
      throw new Error('Fee sponsorship is not configured on the server.');
    }

    try {
      // 1. Load the inner transaction
      const innerTx = new StellarSDK.Transaction(innerTxXdrBase64, NETWORK_PASSPHRASE);
      
      // 2. Load the sponsor keypair
      const sponsorKeypair = StellarSDK.Keypair.fromSecret(this.sponsorSecret);
      
      // 3. Estimate fees for the fee bump
      const feeBumpTx = StellarSDK.TransactionBuilder.buildFeeBumpTransaction(
        sponsorKeypair,
        StellarSDK.BASE_FEE * 2, // Provide a higher fee to ensure it gets mined
        innerTx,
        NETWORK_PASSPHRASE
      );

      // 4. Sign the fee bump transaction with the sponsor key
      feeBumpTx.sign(sponsorKeypair);

      // 5. Submit to network
      const result = await sorobanServer.sendTransaction(feeBumpTx);
      
      if (result.status === 'ERROR') {
         throw new Error(`Sponsor submission failed: ${result.errorResultXdr || result.hash}`);
      }

      return {
        success: true,
        hash: feeBumpTx.hash().toString('hex'),
        status: result.status,
        resultXdr: result.resultXdr,
      };

    } catch (error) {
      console.error('Fee sponsorship error:', error);
      throw error;
    }
  }
}

export const sponsorService = new SponsorService();
export default sponsorService;
