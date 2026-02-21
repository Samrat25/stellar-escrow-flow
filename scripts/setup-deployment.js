#!/usr/bin/env node
/**
 * Contract Deployment Setup for Development
 * This script helps set up the contract ID for the MVP
 */
import { Keypair } from '@stellar/stellar-sdk';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDeployment() {
  console.log('\n🚀 Stellar Escrow Contract Setup');
  console.log('================================\n');

  // Step 1: Create a test keypair if needed
  console.log('Step 1: Stellar Account Setup');
  console.log('-----------------------------');
  
  const envPath = path.join(__dirname, '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check if we already have a contract ID
  if (envContent.includes('CONTRACT_ID=CAAAA')) {
    console.log('✓ Contract ID already configured\n');
  } else {
    console.log('⚠️  No CONTRACT_ID found in .env\n');
  }

  // Step 2: Generate test keypair if needed
  if (!process.env.DEPLOY_ACCOUNT) {
    console.log('Step 2: Generate Test Keypair');
    console.log('-----------------------------');
    const newKeypair = Keypair.random();
    console.log(`Public Key: ${newKeypair.publicKey()}`);
    console.log(`Secret Key: ${newKeypair.secret()}\n`);
    
    console.log('💡 Save these for contract deployment:\n');
    console.log(`export DEPLOY_ACCOUNT="${newKeypair.publicKey()}"`);
    console.log(`export DEPLOY_SECRET="${newKeypair.secret()}"\n`);
    
    console.log('Then fund the account at: https://friendbot.stellar.org/?addr=' + newKeypair.publicKey() + '\n');
  }

  // Step 3: Instruction for deploying
  console.log('Step 3: Deploy Contract to Soroban Testnet');
  console.log('-----------------------------------------\n');
  
  console.log('You have two options:\n');
  
  console.log('OPTION A: Using Soroban CLI (Recommended)');
  console.log('1. Install soroban-cli: cargo install soroban-cli');
  console.log('2. Deploy: soroban contract deploy \\');
  console.log('     --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm \\');
  console.log('     --rpc-url https://soroban-testnet.stellar.org \\');
  console.log('     --network-passphrase "Test SDF Network ; February 2021" \\');
  console.log('     --source-account YOUR_PUBLIC_KEY\n');
  
  console.log('OPTION B: Using Docker with pre-built soroban');
  console.log('docker run --rm -v $(pwd):/workspace soroban-cli \\');
  console.log('  soroban contract deploy ...\n');
  
  console.log('OPTION C: Using Soroban Web IDE');
  console.log('Visit: https://stellar.expert/soroban/testnet\n');

  // Step 4: Update .env template
  console.log('Step 4: Update Environment Variables');
  console.log('-----------------------------------\n');
  
  console.log('After deployment, update backend/.env:');
  console.log('CONTRACT_ID=CAAA...  # Your deployed contract ID\n');
  
  console.log('For Supabase (Optional):');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_ANON_KEY=your_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');

  // Step 5: Provide mock contract ID for development
  console.log('📝 For Local Development Testing:');
  console.log('----------------------------------\n');
  
  const mockContractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB3MNLHR';
  
  console.log(`You can use this mock CONTRACT_ID for testing:
${mockContractId}\n`);
  
  // Update .env with mock if not already set
  if (!envContent.includes('CONTRACT_ID=CAAA')) {
    const updatedEnv = envContent.replace(
      'CONTRACT_ID=YOUR_CONTRACT_ID_HERE',
      `CONTRACT_ID=${mockContractId}`
    );
    fs.writeFileSync(envPath, updatedEnv);
    console.log(`✓ Updated .env with mock CONTRACT_ID\n`);
  }

  console.log('✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Deploy your contract using one of the options above');
  console.log('2. Update CONTRACT_ID in backend/.env with your deployed contract ID');
  console.log('3. Run: npm start (in backend directory)');
  console.log('4. Connect with Freighter wallet on testnet\n');
}

setupDeployment().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
