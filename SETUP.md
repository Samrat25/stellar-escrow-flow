# TrustPay MVP - Local Development Setup

## Quick Start

```bash
# 1. Clone repository
git clone <your-repo-url>
cd stellar-escrow-flow

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 3. Setup frontend (new terminal)
cd ..
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev

# 4. Start auto-approval agent (new terminal)
cd backend
npm run agent
```

## Detailed Setup

### 1. Prerequisites

Install required tools:

```bash
# Node.js 18+ (using nvm)
nvm install 18
nvm use 18

# Verify installation
node --version  # Should be 18+
npm --version
```

### 2. Database Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - Name: `trustpay-mvp`
   - Database Password: (generate strong password)
   - Region: (closest to you)
4. Wait for project to be ready (~2 minutes)

#### Get Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key
   - `service_role` `secret` key (keep this secret!)

#### Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy entire contents of `backend/database/schema.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

#### Verify Tables Created

Go to Table Editor and verify these tables exist:
- users
- escrows
- milestones
- feedback
- transaction_logs

### 3. Backend Configuration

```bash
cd backend
npm install
```

Create `.env` file:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015

# Supabase (from step 2)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Server
PORT=3001
NODE_ENV=development
```

Test backend:

```bash
npm run dev
```

You should see:
```
🚀 TrustPay Backend running on port 3001
📡 Network: testnet
🔗 Horizon: https://horizon-testnet.stellar.org
```

Test health endpoint:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T...",
  "service": "trustpay-backend"
}
```

### 4. Frontend Configuration

Open new terminal:

```bash
cd stellar-escrow-flow  # root directory
npm install
```

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

Start frontend:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Visit `http://localhost:5173` in your browser.

### 5. Auto-Approval Agent

Open new terminal:

```bash
cd backend
npm run agent
```

You should see:
```
🤖 Auto-Approval Agent starting...
[timestamp] Running auto-approval check...
No milestones to auto-approve
⏰ Scheduled to run every 5 minutes
```

Keep this running in the background.

### 6. Wallet Setup

#### Install Freighter Wallet

1. Install [Freighter](https://www.freighter.app/) browser extension
2. Create new wallet or import existing
3. Switch to Testnet:
   - Click Freighter icon
   - Settings > Network
   - Select "Testnet"

#### Fund Test Accounts

1. Go to [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Click "Generate keypair"
3. Copy Public Key (starts with G)
4. Click "Fund account with Friendbot"
5. Wait for confirmation
6. Repeat for multiple test accounts

Save your test accounts:
```
Client Account:
Public: GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9
Secret: S... (keep secret!)

Freelancer Account:
Public: GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DSTL
Secret: S... (keep secret!)
```

### 7. Test the Application

#### Connect Wallet

1. Open `http://localhost:5173`
2. Click "Connect Wallet"
3. Approve in Freighter
4. You should see your address in navbar

#### Create Escrow (as Client)

1. Click "Create Escrow"
2. Fill in:
   - Freelancer Wallet: (paste freelancer public key)
   - Review Window: 3 days
   - Milestone 1: "Design mockups", 1000 XLM
   - Milestone 2: "Frontend implementation", 2000 XLM
   - Milestone 3: "Testing and deployment", 1000 XLM
3. Click "Create Escrow & Deposit Funds"
4. Wait for confirmation
5. Note the transaction hash

#### Submit Milestone (as Freelancer)

1. Switch to freelancer account in Freighter
2. Refresh page and connect wallet
3. Go to "Freelancer" dashboard
4. Find your escrow
5. Click "Submit Milestone" on Milestone 1
6. Enter proof URL: `https://github.com/user/repo`
7. Submit
8. Note the transaction hash

#### Approve Milestone (as Client)

1. Switch back to client account in Freighter
2. Go to "Client" dashboard
3. Find the escrow
4. See submitted milestone with countdown
5. Click "Approve"
6. Confirm transaction
7. Verify freelancer received payment

#### Test Auto-Approval

1. Create new escrow with 1-day review window
2. Submit milestone as freelancer
3. Wait for review window to expire (or modify deadline in database for testing)
4. Auto-approval agent will approve automatically
5. Check agent logs for confirmation

### 8. Development Workflow

#### Backend Changes

```bash
cd backend
# Edit files in src/
# Server auto-restarts with --watch flag
npm run dev
```

#### Frontend Changes

```bash
# Edit files in src/
# Vite hot-reloads automatically
npm run dev
```

#### Database Changes

1. Edit `backend/database/schema.sql`
2. Run in Supabase SQL Editor
3. Or use migrations (future enhancement)

#### Testing API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Create escrow
curl -X POST http://localhost:3001/escrow/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientWallet": "G...",
    "freelancerWallet": "G...",
    "milestones": [
      {"description": "Milestone 1", "amount": "1000"}
    ],
    "reviewWindowDays": 3
  }'

# Get escrow
curl http://localhost:3001/escrow/:id

# Get wallet escrows
curl http://localhost:3001/escrow/wallet/G...
```

### 9. Troubleshooting

#### Backend won't start

```bash
# Check Node version
node --version  # Should be 18+

# Check dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Check .env file exists
cat .env

# Check Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
client.from('users').select('count').then(console.log);
"
```

#### Frontend won't start

```bash
# Check dependencies
rm -rf node_modules package-lock.json
npm install

# Check .env file
cat .env

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### Wallet won't connect

- Ensure Freighter is installed
- Switch to Testnet in Freighter settings
- Refresh page
- Check browser console for errors

#### API calls fail

- Verify backend is running on port 3001
- Check VITE_API_URL in frontend .env
- Check CORS is enabled in backend
- Check browser network tab for errors

#### Auto-approval not working

- Verify agent is running
- Check agent logs
- Verify milestone has review_deadline in past
- Check milestone status is 'SUBMITTED'
- Query database:
  ```sql
  SELECT * FROM milestones 
  WHERE status = 'SUBMITTED' 
  AND review_deadline < NOW();
  ```

### 10. Database Queries for Testing

```sql
-- View all escrows
SELECT * FROM escrows ORDER BY created_at DESC;

-- View all milestones
SELECT 
  e.id as escrow_id,
  m.milestone_index,
  m.description,
  m.status,
  m.review_deadline
FROM milestones m
JOIN escrows e ON m.escrow_id = e.id
ORDER BY e.created_at DESC, m.milestone_index;

-- View escrow statistics
SELECT * FROM get_escrow_stats();

-- View feedback
SELECT * FROM feedback ORDER BY created_at DESC;

-- Check milestones ready for auto-approval
SELECT 
  m.*,
  e.contract_id,
  e.client_wallet,
  e.freelancer_wallet
FROM milestones m
JOIN escrows e ON m.escrow_id = e.id
WHERE m.status = 'SUBMITTED'
AND m.review_deadline < NOW();
```

### 11. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

### 12. Code Style

```bash
# Run linter
npm run lint

# Format code (if configured)
npm run format
```

### 13. Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 14. Building for Production

```bash
# Backend
cd backend
npm start

# Frontend
npm run build
npm run preview  # Preview production build
```

## Next Steps

1. Complete local setup
2. Test full escrow lifecycle
3. Review code structure
4. Read DEPLOYMENT.md for production deployment
5. Start implementing features or fixes

## Getting Help

- Check browser console for frontend errors
- Check terminal for backend errors
- Check Supabase logs for database errors
- Review Stellar Explorer for transaction details
- Check agent logs for auto-approval issues

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Freighter Wallet](https://www.freighter.app/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet)
