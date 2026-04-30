# ⚡ Quick Contract Deployment

## The Problem
- Windows SDK missing (kernel32.lib not found)
- Building Rust contracts on Windows requires full Visual Studio installation
- This is taking too long

## ✅ SOLUTION: Use Pre-built WASM or Deploy from Linux/WSL

### Option 1: Use WSL (Windows Subsystem for Linux) - RECOMMENDED

1. **Install WSL** (if not already installed):
```powershell
wsl --install
```
Restart your computer.

2. **Open WSL terminal** and navigate to project:
```bash
cd /mnt/c/Users/SAMRAT\ NATTA/OneDrive/Desktop/stellar-escrow-flow
```

3. **Install Rust in WSL**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32v1-none
```

4. **Install Stellar CLI in WSL**:
```bash
curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh
```

5. **Build and Deploy**:
```bash
cd contract
stellar contract build
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_escrow.wasm \
  --source deployer \
  --network testnet
```

6. **Copy the CONTRACT_ID** and update `backend/.env`

---

### Option 2: Install Windows 10 SDK

The missing component is Windows 10 SDK. Install it:

```powershell
winget install --id Microsoft.WindowsSDK.10.0.22621
```

Then restart PowerShell and try building again.

---

### Option 3: Use GitHub Codespaces (Cloud)

1. Go to your GitHub repo
2. Click "Code" → "Codespaces" → "Create codespace"
3. In the codespace terminal:
```bash
cd contract
stellar contract build
stellar keys generate deployer --network testnet  
stellar keys fund deployer --network testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_escrow.wasm \
  --source deployer \
  --network testnet
```

---

### Option 4: Use Pre-deployed Contract (Testing Only)

If you just want to test the UI while figuring out deployment:

1. Use a testnet contract that's already deployed
2. Update `backend/.env`:
```env
# Temporary - use existing Stellar Asset Contract for testing
CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
USE_REAL_CONTRACT=true
```

**NOTE**: This won't work perfectly as it's not your escrow contract, but you can see the UI.

---

## After Deployment

Once you have a CONTRACT_ID:

1. Update `backend/.env`:
```env
CONTRACT_ID=YOUR_NEW_CONTRACT_ID_HERE
USE_REAL_CONTRACT=true
TOKEN_ADDRESS=native
```

2. Test it:
```bash
node backend/test-contract.js
```

3. Start the app:
```bash
# Terminal 1
cd backend
npm start

# Terminal 2  
cd frontend
npm run dev
```

---

## Why This Happened

Windows Rust development requires:
- Visual Studio Build Tools ✅ (installed)
- Windows 10 SDK ❌ (missing - this has kernel32.lib)
- MSVC toolchain ✅ (installed)

The SDK installation is large (~2GB) and takes time.

---

## Recommended: Use WSL

WSL is the fastest solution:
- No Windows SDK needed
- Linux toolchain works perfectly
- Same computer, different environment
- Takes 5-10 minutes total

```powershell
# Install WSL
wsl --install

# After restart, open WSL and follow Option 1 above
```

---

## Need Help?

All the code fixes are committed. The contract service is ready. You just need to:
1. Deploy the contract (using any option above)
2. Update CONTRACT_ID in backend/.env
3. Run the app

The "Bad union switch: 1" error will disappear once the contract is deployed!
