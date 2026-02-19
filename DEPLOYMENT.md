# TrustPay MVP - Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Stellar account with testnet XLM
- Supabase account
- Git

## 1. Database Setup (Supabase)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys

### Run Database Schema
1. Open Supabase SQL Editor
2. Copy contents of `backend/database/schema.sql`
3. Execute the SQL script
4. Verify tables are created

### Get Credentials
- Project URL: `https://your-project.supabase.co`
- Anon Key: From Settings > API
- Service Role Key: From Settings > API (keep secret!)

## 2. Backend Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3001
NODE_ENV=production
```

### Test Locally
```bash
npm run dev
```

Visit `http://localhost:3001/health` - should return `{"status":"healthy"}`

### Deploy Backend

#### Option A: Railway
1. Create account at [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Select your repository
4. Add environment variables from `.env`
5. Deploy

#### Option B: Render
1. Create account at [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repository
4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && npm start`
6. Add environment variables
7. Deploy

#### Option C: Heroku
```bash
heroku create trustpay-backend
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_KEY=...
# ... set all env vars
git subtree push --prefix backend heroku main
```

Note your backend URL: `https://your-backend.railway.app`

## 3. Auto-Approval Agent Setup

The auto-approval agent must run continuously.

### Option A: Same Server as Backend
Add to your deployment's start script:
```bash
npm start & npm run agent
```

### Option B: Separate Service
Deploy as separate service with same environment variables:
```bash
npm run agent
```

### Option C: Cron Job (if supported)
Some platforms support cron jobs. Configure to run every 5 minutes:
```
*/5 * * * * cd /app/backend && node src/agents/auto-approval.js
```

## 4. Frontend Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=https://your-backend.railway.app
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Build
```bash
npm run build
```

### Deploy Frontend

#### Option A: Vercel
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

#### Option C: GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

Note your frontend URL: `https://your-app.vercel.app`

## 5. Smart Contract Deployment (Future)

Currently using mock contract service. To deploy real Soroban contract:

### Prerequisites
- Rust toolchain
- Soroban CLI

### Build Contract
```bash
cd backend/contracts/escrow
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/escrow.wasm
```

### Deploy to Testnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

### Update Backend
Replace mock contract service with real contract calls in `backend/src/services/contract.js`

## 6. Testing with Real Users

### Get Testnet XLM
1. Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Generate keypairs for 5+ test users
3. Fund accounts with testnet XLM

### Test Accounts Template
```
Client 1: G...
Client 2: G...
Freelancer 1: G...
Freelancer 2: G...
Freelancer 3: G...
```

### Full Lifecycle Test
1. Client creates escrow
2. Client deposits funds
3. Freelancer submits milestone
4. Client approves OR wait for auto-approval
5. Verify payment received
6. Complete all milestones
7. Verify escrow completed

### Document Results
- Transaction hashes
- Explorer links
- Screenshots
- Feedback collected

## 7. Monitoring

### Backend Health
```bash
curl https://your-backend.railway.app/health
```

### Database Queries
```sql
-- Check escrow stats
SELECT * FROM get_escrow_stats();

-- Check pending auto-approvals
SELECT * FROM milestones 
WHERE status = 'SUBMITTED' 
AND review_deadline < NOW();

-- Check recent transactions
SELECT * FROM transaction_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Auto-Approval Agent Logs
Check your deployment platform's logs for:
```
[timestamp] Running auto-approval check...
[timestamp] Found X milestone(s) to auto-approve
[timestamp] ✅ Auto-approved milestone Y
```

## 8. Troubleshooting

### Backend not connecting to Supabase
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
- Check Supabase project is active
- Verify RLS policies allow service role

### Frontend can't reach backend
- Check VITE_API_URL is correct
- Verify CORS is enabled in backend
- Check backend is running

### Auto-approval not working
- Verify agent is running
- Check review_deadline is in the past
- Verify milestone status is 'SUBMITTED'
- Check agent logs for errors

### Wallet connection fails
- Ensure Freighter wallet is installed
- Switch to Stellar Testnet in Freighter
- Fund account with testnet XLM

## 9. Security Checklist

- [ ] Supabase service key is secret (not in frontend)
- [ ] RLS policies are enabled
- [ ] CORS is configured properly
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled (production)
- [ ] HTTPS enabled (production)
- [ ] Environment variables not committed to git

## 10. Post-Deployment

### Update README
- Add live demo URL
- Add API documentation URL
- Add Stellar Explorer links

### Collect Feedback
- Share with 5+ testnet users
- Collect feedback via `/feedback` page
- Document issues and improvements

### Iterate
- Fix critical bugs
- Implement top feedback items
- Document changes

## Support

For issues:
1. Check logs (backend, agent, browser console)
2. Verify environment variables
3. Test with curl/Postman
4. Check Supabase logs
5. Review Stellar Explorer for transaction details

## Next Steps

After successful MVP deployment:
1. Deploy real Soroban contract
2. Add more comprehensive tests
3. Implement reputation system
4. Add dispute resolution
5. Support multiple assets (USDC, etc.)
6. Launch on mainnet
