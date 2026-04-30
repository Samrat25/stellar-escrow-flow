# 🚀 Deploy Your Contract RIGHT NOW (No Installation Needed!)

## Use GitHub Codespaces - 100% Online, Takes 5 Minutes

### Step 1: Open Codespaces
1. Go to: https://github.com/Samrat25/stellar-escrow-flow
2. Click the green **"Code"** button (top right)
3. Click **"Codespaces"** tab
4. Click **"Create codespace on main"**

Wait 1-2 minutes for it to load. You'll see VS Code in your browser.

---

### Step 2: Install Stellar CLI
In the terminal at the bottom, copy-paste this:

```bash
cargo install --locked stellar-cli
```

Wait 2-3 minutes. You'll see "Installed package `stellar-cli`"

---

### Step 3: Add to PATH
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

---

### Step 4: Build Contract
```bash
cd contract
stellar contract build
```

You'll see: "✅ Built: target/wasm32v1-none/release/stellar_escrow.wasm"

---

### Step 5: Create & Fund Account
```bash
stellar keys generate deployer --network testnet --fund
```

You'll see your public key starting with 'G'

---

### Step 6: Deploy Contract
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_escrow.wasm \
  --source deployer \
  --network testnet
```

**COPY THE CONTRACT ID** - it starts with 'C' and looks like:
```
CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

---

### Step 7: Update .env on Your Computer

On your Windows computer, open `backend/.env` and change:

```env
CONTRACT_ID=<PASTE_YOUR_CONTRACT_ID_HERE>
USE_REAL_CONTRACT=true
TOKEN_ADDRESS=native
```

---

### Step 8: Test It

On your Windows computer:
```powershell
node backend/test-contract.js
```

You should see: **✅ TEST PASSED - Contract is working correctly!**

---

### Step 9: Run Your App

```powershell
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev
```

---

## ✅ DONE!

Your contract is deployed and working! The "Bad union switch: 1" error is gone!

---

## Why Codespaces?

- ✅ No WSL needed
- ✅ No Windows SDK needed
- ✅ No Visual Studio needed
- ✅ 100% in browser
- ✅ Free (60 hours/month)
- ✅ Works perfectly every time

---

## Troubleshooting

**Q: Where's the terminal in Codespaces?**
A: Bottom of screen. If not visible, press `` Ctrl+` ``

**Q: "stellar: command not found"**
A: Run: `export PATH="$HOME/.cargo/bin:$PATH"`

**Q: Codespaces won't load**
A: Refresh the page or try a different browser

**Q: "You've used all free hours"**
A: You get 60 hours/month free. Wait until next month or create new GitHub account.

---

## Screenshot Guide

Here's what you'll see:

1. **GitHub Code button** → Click it
2. **Codespaces tab** → Click it  
3. **Create codespace** → Click it
4. **VS Code loads in browser** → Terminal at bottom
5. **Run commands** → Copy-paste from above
6. **Get CONTRACT_ID** → Copy it
7. **Update .env** → On your computer
8. **Test & Run** → On your computer

---

## This is THE EASIEST WAY!

No installation, no configuration, no Windows issues. Just click and deploy!

Total time: **5 minutes**
