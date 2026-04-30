/**
 * Script to create an escrow on-chain
 * This will generate XDR that you can sign with your wallet
 */

import * as StellarSDK from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const CONTRACT_ID = process.env.CONTRACT_ID;
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Native XLM

// REPLACE THESE WITH YOUR ACTUAL WALLET ADDRESSES
const CLIENT_WALLET = 'GBDU4OAZGXD5YFSA3DWO5CC7MSYC62U2JNWEGHWF7ORRPCYZBPIIXAVZ'; // Your wallet
const FREELANCER_WALLET = 'GDK5QF2TMPSXYYJ5LUOZOKZ7ZH36PT6D7GK37Z7TFBF34W7VRQ4OEYIB'; // Deployer account (different wallet)

const sorobanServer = new StellarSDK.SorobanRpc.Server(SOROBAN_RPC_URL);
const horizonServer = new StellarSDK.Horizon.Server(HORIZON_URL);

async function createEscrowOnChain() {
  try {
    console.log('🔍 Creating Escrow On-Chain\n');
    console.log('Configuration:');
    console.log('  CONTRACT_ID:', CONTRACT_ID);
    console.log('  CLIENT:', CLIENT_WALLET);
    console.log('  FREELANCER:', FREELANCER_WALLET);
    console.log('  TOKEN:', TOKEN_ADDRESS);
    console.log('');

    // Load client account
    console.log('Step 1: Loading client account...');
    const account = await horizonServer.loadAccount(CLIENT_WALLET);
    console.log('✅ Account loaded, sequence:', account.sequence);

    // Build parameters
    const escrowId = `escrow-${Date.now()}`;
    const amountInStroops = 10000000; // 1 XLM
    const reviewWindowDays = 7;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (30 * 86400); // 30 days

    console.log('\nStep 2: Building transaction parameters...');
    console.log('  Escrow ID:', escrowId);
    console.log('  Amount: 1 XLM (10,000,000 stroops)');
    console.log('  Review Window:', reviewWindowDays, 'days');
    console.log('  Deadline:', new Date(deadlineTimestamp * 1000).toISOString());

    // Build parameters using xdr module
    const params = [
      StellarSDK.xdr.ScVal.scvString(Buffer.from(escrowId)),
      new StellarSDK.Address(CLIENT_WALLET).toScVal(),
      new StellarSDK.Address(FREELANCER_WALLET).toScVal(),
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

    console.log('\nStep 3: Building transaction...');
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

    // Simulate
    console.log('\nStep 4: Simulating transaction...');
    const simulatedTx = await sorobanServer.simulateTransaction(transaction);

    if (StellarSDK.SorobanRpc.Api.isSimulationSuccess(simulatedTx)) {
      console.log('✅ Simulation successful!');
      transaction = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulatedTx).build();
      console.log('✅ Transaction assembled');

      const xdr = transaction.toXDR();
      console.log('\n✅ XDR generated, length:', xdr.length);
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCESS! Escrow transaction ready!');
      console.log('='.repeat(60));
      console.log('\nNext steps:');
      console.log('1. Copy the XDR below');
      console.log('2. Go to: https://lab.stellar.org/r/testnet/xdr/import');
      console.log('3. Paste the XDR');
      console.log('4. Click "Import Transaction"');
      console.log('5. Click "Sign in Transaction Signer"');
      console.log('6. Sign with your wallet (Freighter)');
      console.log('7. Click "Submit to Network"');
      console.log('8. Wait for confirmation');
      console.log('9. Copy the transaction hash');
      console.log('10. NOW you can fund the escrow!');
      console.log('\n' + '='.repeat(60));
      console.log('XDR TO SIGN:');
      console.log('='.repeat(60));
      console.log(xdr);
      console.log('='.repeat(60));
      console.log('\nEscrow ID (save this):', escrowId);
      console.log('='.repeat(60));

    } else {
      console.error('❌ Simulation failed!');
      console.error(JSON.stringify(simulatedTx, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

createEscrowOnChain();
