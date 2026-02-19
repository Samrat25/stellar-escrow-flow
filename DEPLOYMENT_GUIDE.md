# Stellar Escrow MVP - Deployment Guide

## Current Status

✅ Backend running on http://localhost:3001
✅ Frontend running on http://localhost:8080
✅ Auto-approval agent running
✅ Database initialized (SQLite)

## Next Steps

### 1. Build & Deploy Smart Contract

```bash
# Install Rust and Soroban CLI first
# https://soroban.stellar.org/docs/getting-started/setup

cd contract

# Build contract
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm

# Deploy to testnet (requires funded Stellar account)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm \
  --source YOUR_STELLAR_ADDRESS \
  --network testnet

# Copy the CONTRACT_ID from output
```

### 2. Update Configuration

After deploying contract, update `backend/.env`:

```env
CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
USE_REAL_CONTRACT=true
```

Restart backend:
```bash
# Stop current backend process
# Restart: cd backend && npm run dev
```

### 3. Test the Application

1. Open http://localhost:8080
2. Connect wallet (Freighter or Albedo)
3. Create escrow as client
4. Submit milestone as freelancer
5. Approve/reject as client
6. Watch auto-approval after review window

## Architecture

```
┌─────────────┐
│  Frontend   │ http://localhost:8080
│  React+Vite │
└──────┬──────┘
       │
       │ REST API
       ▼
┌─────────────┐
│   Backend   │ http://localhost:3001
│ Express+API │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Database │  │ Contract │
│  SQLite  │  │ Soroban  │
└──────────┘  └──────────┘
       ▲
       │
┌──────────────┐
│ Auto-Approve │
│    Agent     │
└──────────────┘
```

## API Endpoints

- POST /escrow/create - Create new escrow
- POST /escrow/deposit - Deposit funds
- GET /escrow/:id - Get escrow details
- GET /escrow/wallet/:address - Get wallet escrows
- POST /milestone/submit - Submit milestone
- POST /milestone/approve - Approve milestone
- POST /milestone/reject - Reject milestone
- GET /health - Health check

## Contract Functions

- create_escrow - Initialize escrow with milestones
- deposit_funds - Client deposits total amount
- submit_milestone - Freelancer submits work
- approve_milestone - Client approves and releases funds
- reject_milestone - Client rejects submission
- auto_approve - Auto-approve after review window
- get_escrow - Query escrow state
- get_milestone - Query milestone state

## Troubleshooting

### Backend not connecting to contract
- Verify CONTRACT_ID in backend/.env
- Check USE_REAL_CONTRACT=true
- Ensure contract is deployed on testnet

### Frontend wallet connection issues
- Install Freighter extension
- Switch to Stellar testnet
- Fund account from friendbot

### Database errors
- Delete backend/prisma/dev.db
- Run: npx prisma migrate dev --name init
- Restart backend

## Production Deployment

1. Use PostgreSQL instead of SQLite
2. Deploy contract to mainnet
3. Set NODE_ENV=production
4. Use environment variables for secrets
5. Enable HTTPS
6. Set up monitoring
7. Configure CORS properly
8. Use process manager (PM2)
