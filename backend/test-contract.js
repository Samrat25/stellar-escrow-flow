/**
 * Test script to verify Soroban contract interaction
 * Run with: node backend/test-contract.js
 */

import * as StellarSDK from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const CONTRACT_ID = process.env.CONTRACT_ID;
const TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const sorobanServer = new StellarSDK.SorobanRpc.Server(SOROBAN_RPC_URL);
const horizonServer = new StellarSDK.Horizon.Server(HORIZON_URL);

async function testContractInteraction() {
  console.log('🔍 Testing Soroban Contract Interaction\n');
  
  console.log('Configuration:');
  console.log('  CONTRACT_ID:', CONTRACT_ID);
  console.log('  TOKEN_ADDRESS:', TOKEN_ADDRESS);
  console.log('  SOROBAN_RPC:', SOROBAN_RPC_URL);
  console.log('  NETWORK:', NETWORK_PASSPHRASE);
  console.log('');

  // Test wallets - using real wallets from database
  const clientWallet = 'GDYCJYHGGA7Z3FI7J5OUBKPGQCIRKFQYMDBPNZSJJE3OBHQPJA4VEYSL';
  const freelancerWallet = 'GCUPUOYOTTRXNO7M2ES37KP4X7WDBPHILDCN3ZSOJDYNKZFJI6GPAI7L';
  const amount = 10; // 10 XLM

  try {
    console.log('Step 1: Loading client account...');
    const account = await horizonServer.loadAccount(clientWallet);
    console.log('✅ Account loaded, sequence:', account.sequence);
    console.log('');

    console.log('Step 2: Building contract call parameters...');
    const amountInStroops = Math.floor(amount * 10000000);
    const escrowId = `test-escrow-${Date.now()}`;
    const reviewWindowDays = 7;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (30 * 86400);

    console.log('  Escrow ID:', escrowId);
    console.log('  Amount (stroops):', amountInStroops);
    console.log('  Review Window:', reviewWindowDays, 'days');
    console.log('  Deadline:', new Date(deadlineTimestamp * 1000).toISOString());
    console.log('');

    console.log('Step 3: Creating transaction with proper XDR encoding...');
    
    // Build parameters using xdr module directly for better control
    const params = [
      StellarSDK.xdr.ScVal.scvString(Buffer.from(escrowId)),
      new StellarSDK.Address(clientWallet).toScVal(),
      new StellarSDK.Address(freelancerWallet).toScVal(),
      new StellarSDK.Address(TOKEN_ADDRESS).toScVal(),
      StellarSDK.xdr.ScVal.scvVec([
        StellarSDK.xdr.ScVal.scvI128(
          new StellarSDK.xdr.Int128Parts({
            lo: StellarSDK.xdr.Uint64.fromString(String(amountInStroops)),
            hi: StellarSDK.xdr.Int64.fromString('0')
          })
        )
      ]),
      StellarSDK.xdr.ScVal.scvU32(reviewWindowDays),
      StellarSDK.xdr.ScVal.scvU64(StellarSDK.xdr.Uint64.fromString(String(deadlineTimestamp)))
    ];
    
    let transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSDK.Operation.invokeContractFunction({
          contract: CONTRACT_ID,
          function: 'create_escrow',
          args: params
        })
      )
      .setTimeout(180)
      .build();

    console.log('✅ Transaction built');
    console.log('');

    console.log('Step 4: Simulating transaction...');
    const simulatedTx = await sorobanServer.simulateTransaction(transaction);
    
    if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulatedTx)) {
      console.log('✅ Simulation successful!');
      console.log('  Cost:', simulatedTx.cost);
      console.log('  Latest Ledger:', simulatedTx.latestLedger);
      
      transaction = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulatedTx).build();
      console.log('✅ Transaction assembled');
      
      const xdr = transaction.toXDR();
      console.log('✅ XDR generated, length:', xdr.length);
      console.log('');
      
      console.log('🎉 SUCCESS! Contract interaction works correctly!');
      console.log('');
      console.log('Next steps:');
      console.log('1. User would sign this XDR with their wallet');
      console.log('2. Submit signed transaction to Stellar network');
      console.log('3. Transaction would create escrow on-chain');
      
      return { success: true, xdr };
    } else {
      console.error('❌ Simulation failed!');
      console.error('Error:', JSON.stringify(simulatedTx, null, 2));
      
      if (simulatedTx.error) {
        console.error('Error message:', simulatedTx.error);
        
        // Check for common errors
        if (simulatedTx.error.includes('MissingValue')) {
          console.error('');
          console.error('⚠️  CONTRACT NOT FOUND');
          console.error('The contract at', CONTRACT_ID, 'does not exist on testnet.');
          console.error('Please deploy the contract first using:');
          console.error('  cd contract');
          console.error('  ./deploy.sh');
        }
      }
      
      if (simulatedTx.events) {
        console.error('Events:', simulatedTx.events);
      }
      
      return { success: false, error: simulatedTx.error || 'Simulation failed' };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Provide helpful error messages
    if (error.message.includes('Bad union switch')) {
      console.error('');
      console.error('⚠️  XDR PARSING ERROR');
      console.error('This usually means the contract doesn\'t exist or isn\'t properly deployed.');
      console.error('Please verify:');
      console.error('1. Contract is deployed at:', CONTRACT_ID);
      console.error('2. Contract is on testnet (not futurenet or mainnet)');
      console.error('3. Contract has been initialized');
    } else if (error.message.includes('Account not found')) {
      console.error('');
      console.error('⚠️  ACCOUNT NOT FUNDED');
      console.error('Please fund the account with XLM:');
      console.error('  curl "https://friendbot.stellar.org?addr=' + clientWallet + '"');
    }
    
    if (error.response) {
      console.error('Response:', error.response);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testContractInteraction()
  .then(result => {
    console.log('');
    console.log('='.repeat(60));
    if (result.success) {
      console.log('✅ TEST PASSED - Contract is working correctly!');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED - Contract interaction failed');
      console.log('Error:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
