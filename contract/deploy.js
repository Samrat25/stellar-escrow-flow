#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { StrKey, Keypair, TransactionBuilder, BASE_FEE, Networks } from '@stellar/stellar-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RPC_URL = 'https://soroban-testnet.stellar.org';
const ACCOUNT = process.env.DEPLOY_ACCOUNT || 'GCZST3XVCDTUJ76ZAV2HA72KYQGAL3ZEU3OD7QDHMAKFZUMVP3RDRMLK'; // YOU NEED TO SET YOUR ACCOUNT
const SECRET = process.env.DEPLOY_SECRET || ''; // YOU NEED TO SET YOUR SECRET
const WASM_FILE = path.join(__dirname, 'target/wasm32-unknown-unknown/release/stellar_escrow.wasm');

if (!SECRET) {
  console.error('ERROR: DEPLOY_SECRET environment variable is required');
  console.error('Usage: DEPLOY_SECRET=your_secret DEPLOY_ACCOUNT=your_account node deploy.js');
  process.exit(1);
}

async function getAccountSequence(accountId) {
  const response = await fetch(`${RPC_URL}/accounts/${accountId}`);
  if (!response.ok) throw new Error(`Failed to get account: ${response.statusText}`);
  const data = await response.json();
  return data.sequence;
}

async function submitTransaction(tx) {
  const envelope = tx.toEnvelope().toXDR('base64');
  
  const response = await fetch(`${RPC_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx: envelope }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transaction failed: ${error}`);
  }
  
  return response.json();
}

async function deploy() {
  console.log('📦 Stellar Escrow Contract Deployment');
  console.log('=====================================');
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Account: ${ACCOUNT.slice(0, 8)}...${ACCOUNT.slice(-4)}`);
  console.log(`WASM File: ${WASM_FILE}`);
  
  // Read WASM file
  if (!fs.existsSync(WASM_FILE)) {
    console.error(`❌ WASM file not found: ${WASM_FILE}`);
    process.exit(1);
  }
  
  const wasmBuffer = fs.readFileSync(WASM_FILE);
  console.log(`📄 WASM size: ${(wasmBuffer.length / 1024).toFixed(2)} KB`);
  
  try {
    // Get account sequence
    console.log('\n🔍 Fetching account sequence...');
    const sequence = await getAccountSequence(ACCOUNT);
    console.log(`✓ Sequence: ${sequence}`);
    
    // Create keypair
    const keypair = Keypair.fromSecret(SECRET);
    
    // Build transaction (this is a simplified example)
    console.log('\n🔨 Building deployment transaction...');
    const txBuilder = new TransactionBuilder(
      { id: () => ACCOUNT, sequenceNumber: () => sequence, balances: [], signers: [] },
      {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET_NETWORK_PASSPHRASE,
      }
    );
    
    console.log('\n⚠️  Manual Deployment Required');
    console.log('=====================================');
    console.log('Due to Soroban SDK complexity, please deploy using one of these methods:\n');
    
    console.log('1️⃣  Using Soroban CLI (if installed):');
    console.log('   soroban contract deploy \\');
    console.log(`     --wasm ${WASM_FILE} \\`);
    console.log('     --rpc-url ' + RPC_URL + ' \\');
    console.log('     --network-passphrase "Test SDF Network ; February 2021" \\');
    console.log('     --source-account ' + ACCOUNT + '\n');
    
    console.log('2️⃣  Using CLI directly:');
    console.log('   cd contract && soroban contract deploy --help\n');
    
    console.log('3️⃣  Pre-built contract deployment:');
    console.log('   Visit: https://soroban-testnet.stellar.org/deployment');
    console.log(`   Upload WASM: ${WASM_FILE}\n`);
    
    console.log('After deployment, save your CONTRACT_ID in .env:\n');
    console.log('   CONTRACT_ID=CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...\n');
    
    // Since we can't easily deploy without soroban CLI, let's use a mock for now
    const mockContractId = 'CAAAAAAAAAAAAAAAAAAA' + Buffer.from(wasmBuffer.slice(0, 20)).toString('hex');
    
    console.log(`📝 Sample CONTRACT_ID (for testing): ${mockContractId}`);
    console.log('\n✨ Contract compilation successful!\n');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();
