# 🚀 Complete Deployment Instructions

## Current Status

✅ Stellar CLI installed (v26.0.0)  
⏳ Visual Studio Build Tools installing (may take 10-15 minutes)  
❌ Contract NOT deployed yet

---

## Step 1: Wait for Build Tools Installation

The Visual Studio Build Tools are currently installing in the background. This may take 10-15 minutes.

**To check if installation is complete:**
```powershell
# Open a NEW PowerShell window and run:
link.exe
```

If you see "Microsoft (R) Incremental Linker", the installation is complete.

---

## Step 2: Build the Contract

Once Build Tools are installed, open a **NEW** PowerShell window (to refresh PATH) and run:

```powershell
cd contract
cargo build --target wasm32-unknown-unknown --release
```

This will create: `target/wasm32-unknown-unknown/release/stellar_escrow.wasm`

---

## Step 3: Generate or Use Existing Stellar Account

**Option A: Use existing account**
If you have a testnet account with XLM, use that.

**Option B: Generate new account**
```powershell
# Generate new keypair
stellar keys generate deployer --network testnet

# Fund it with testnet XLM
stellar keys fund deployer --network testnet
```

---

## Step 4: Deploy the Contract

```powershell
cd contract

# Deploy using Stellar CLI
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm `
  --source deployer `
  --network testnet
```

This will output a CONTRACT_ID like:
```
CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

**IMPORTANT**: Copy this CONTRACT_ID!

---

## Step 5: Update Environment Variables

Edit `backend/.env` and update:

```env
CONTRACT_ID=<YOUR_NEW_CONTRACT_ID_FROM_STEP_4>
USE_REAL_CONTRACT=true
TOKEN_ADDRESS=native
```

---

## Step 6: Test the Contract

```powershell
# Test contract interaction
node backend/test-contract.js
```

You should see:
```
✅ TEST PASSED - Contract is working correctly!
```

---

## Step 7: Start the Application

```powershell
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

---

## Troubleshooting

### Build Tools Installation Stuck

If the installation seems stuck for more than 20 minutes:

1. Cancel with Ctrl+C
2. Download manually: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
3. Install with "Desktop development with C++" workload

### Contract Build Fails

**Error**: "linker `link.exe` not found"
**Solution**: Build Tools not installed yet. Wait or install manually (see above).

**Error**: "target 'wasm32-unknown-unknown' not found"
**Solution**: 
```powershell
rustup target add wasm32-unknown-unknown
```

### Contract Deploy Fails

**Error**: "Account not found"
**Solution**: Fund your account:
```powershell
stellar keys fund deployer --network testnet
```

**Error**: "stellar: command not recognized"
**Solution**: Close and reopen PowerShell to refresh PATH.

### Test Script Fails

**Error**: "Bad union switch: 1"
**Solution**: Contract not deployed. Complete Steps 1-4 first.

**Error**: "Contract not found"
**Solution**: Wrong CONTRACT_ID in `.env`. Copy the correct one from Step 4.

---

## Alternative: Use Pre-deployed Contract (Temporary)

If you want to test the application immediately while waiting for Build Tools:

1. Use a mock contract ID temporarily
2. The application will show errors but you can see the UI
3. Deploy the real contract later for full functionality

**NOT RECOMMENDED** - The user explicitly wants REAL contract only!

---

## Verification

After deployment, verify your contract exists:

1. Visit: https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID
2. You should see contract details and transactions

---

## Next Steps After Deployment

1. ✅ Contract deployed and verified
2. ✅ Backend `.env` updated with CONTRACT_ID
3. ✅ Test script passes
4. ✅ Application running
5. ✅ Create milestone works
6. ✅ Ready for Level 6 submission!

---

## Support

If you encounter issues:
- Check Render logs: https://dashboard.render.com
- Stellar Discord: https://discord.gg/stellar
- GitHub Issues: https://github.com/Samrat25/stellar-escrow-flow/issues

---

**Remember**: The application REQUIRES a deployed contract when `USE_REAL_CONTRACT=true`. No mock modes allowed!
