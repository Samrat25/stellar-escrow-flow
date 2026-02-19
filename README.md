# Stellar Escrow Flow

Production-ready milestone-based escrow system on Stellar blockchain.

## Structure

```
/contract  - Soroban smart contract
/backend   - Node.js + Express + Prisma
/frontend  - React + Vite
```

## Setup

### 1. Contract

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm
./deploy.sh testnet YOUR_STELLAR_ADDRESS
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with DATABASE_URL and CONTRACT_ID
npx prisma migrate dev
npm run dev
```

### 3. Auto-Approval Agent

```bash
cd backend
npm run agent
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL
npm run dev
```

## Workflow

1. Client creates escrow with milestones
2. Client deposits funds to contract
3. Freelancer submits milestone with proof
4. Client approves/rejects within review window
5. Auto-approval after review window expires
6. Sequential milestone execution only

## API Endpoints

- POST /escrow/create
- POST /escrow/deposit
- GET /escrow/:id
- GET /escrow/wallet/:address
- POST /milestone/submit
- POST /milestone/approve
- POST /milestone/reject
- GET /health
