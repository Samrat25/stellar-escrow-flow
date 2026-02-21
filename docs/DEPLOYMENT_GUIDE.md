# Deployment Guide - Stellar Escrow Flow

## Prerequisites

- Node.js 18+
- Rust toolchain (for contract)
- Stellar Testnet account with native assets
- Supabase account
- Vercel/Render/Railway account (for backend)
- Git

## Step-by-Step Deployment

### Part 1: Smart Contract Deployment

#### 1.1 Build the Contract

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm
```

Output: `target/wasm32-unknown-unknown/release/stellar_escrow_optimized.wasm`

#### 1.2 Deploy to Testnet

```bash
# Set environment variables
export STELLAR_NETWORK=testnet
export SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
export SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; February 2021"

# Use Soroban CLI to deploy
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/stellar_escrow_optimized.wasm

# Save the contract ID
export CONTRACT_ID=C...
```

#### 1.3 Verify Deployment

```bash
curl https://soroban-testnet.stellar.org:443 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getContractData",
    "params": ["'$CONTRACT_ID'"]
  }'
```

### Part 2: Database Setup (Supabase)

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save connection details

#### 2.2 Apply Database Migrations

```bash
cd backend

# Create .env with DATABASE_URL from Supabase
echo "DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres" > .env

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### 2.3 Optional: Enable RLS

```sql
-- In Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your requirements)
-- Users can only see their own data
CREATE POLICY "Users can see own data" ON users
  FOR SELECT USING (auth.uid()::text = id);
```

### Part 3: Backend Deployment

#### 3.1 Prepare Backend

```bash
cd backend
npm install
```

#### 3.2 Set Environment Variables

```bash
# .env file
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
CONTRACT_ID=C...  # from Step 1.2
DATABASE_URL=postgresql://...  # from Step 2.1
PORT=3001
NODE_ENV=production
USE_REAL_CONTRACT=true
ENABLE_AUTO_APPROVAL_AGENT=true
ENABLE_SYNC_AGENT=true
ENABLE_FEEDBACK_AGENT=true
```

#### 3.3 Deploy to Render

```bash
# 1. Push code to GitHub
git push origin main

# 2. Create Render web service
# - Connect GitHub repo
# - Set environment variables
# - Build: npm install && npx prisma migrate deploy
# - Start: npm start
# - Use PostgreSQL external database from Supabase

# 3. Verify deployment
curl https://your-backend.onrender.com/health
```

#### 3.4 Deploy Agents

Option A: Same process as backend
Option B: Deploy to separate service on Render
Option C: Use GitHub Actions + scheduled workflows

```yaml
# .github/workflows/agents.yml
name: Run Agents
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm run agent
```

### Part 4: Frontend Deployment

#### 4.1 Prepare Frontend

```bash
cd frontend
npm install
```

#### 4.2 Configure Environment

```bash
# .env.production
VITE_API_URL=https://your-backend.onrender.com
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

#### 4.3 Build

```bash
npm run build
```

#### 4.4 Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm install -g vercel
vercel --prod

# Option 2: GitHub Integration
# 1. Push to GitHub
# 2. Connect repo on vercel.com
# 3. Set environment variables
# 4. Deploy automatically on push
```

### Part 5: Configure Domain & SSL

#### 5.1 Update URLs

Update all references to your deployment URLs:
- Backend: https://your-backend.onrender.com
- Frontend: https://your-domain.vercel.app
- Environment variables in all services

#### 5.2 Set CORS Headers

Backend `src/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.vercel.app'],
  credentials: true
}));
```

### Part 6: Monitoring & Alerts

#### 6.1 Set Up Logging

```bash
# Render provides automatic logging
# View at: https://dashboard.render.com/logs

# Add optional: Sentry for error tracking
npm install --save @sentry/node
```

#### 6.2 Configure Health Checks

Render will automatically healthcheck:
```
GET /health every 5 minutes
Restart if no 200 response in 30s
```

#### 6.3 Database Backups

Supabase automatically backs up:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Access via Supabase Dashboard > Backups

## Testing Before Production

### 1. Testnet Testing

```bash
# Create testnet account with friendbot
curl -X POST https://friendbot.stellar.org?addr=GXXXXXX

# Test all flows:
# 1. Create escrow
# 2. Deposit funds
# 3. Submit milestone
# 4. Approve milestone
# 5. Check auto-release

# Use Testnet Explorer: https://stellar.expert/explorer/testnet/
```

### 2. Load Testing

```bash
npm install -g k6

# Create load test script
# Test endpoints with concurrent users
k6 run loadtest.js
```

### 3. Integration Testing

```bash
cd backend
npm test

cd ../frontend
npm test
```

## Production Checklist

### Infrastructure
- [ ] Contract deployed and verified on chain
- [ ] Backend running on production server
- [ ] Database configured and backed up
- [ ] Frontend deployed to CDN
- [ ] Custom domain configured
- [ ] SSL certificates valid
- [ ] Monitoring and logging active

### Security
- [ ] All API keys stored as environment variables
- [ ] Database password changed from default
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Secrets not committed to git
- [ ] Database backups automated

### Operations
- [ ] Agents running and logging
- [ ] Alert channels configured (Slack, email)
- [ ] Runbook created for common issues  
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment process

### Legal & Compliance
- [ ] Terms of service published
- [ ] Privacy policy compliant with GDPR/CCPA
- [ ] KYC requirements if needed
- [ ] AML/CFT compliance check
- [ ] Insurance considerations

## Troubleshooting

### Contract Issues
```bash
# Check contract state
soroban contract info --id C...

# Check recent events
curl https://soroban-testnet.stellar.org \
  -X POST -H "Content-Type: application/json" \
  -d '{"method": "getEvents", "contract_id": "C..."}'
```

### Backend Issues
```bash
# Check logs
tail -f logs.txt

# Restart service
npm start

# Clear database (dev only)
npx prisma migrate reset
```

### Frontend Issues
```bash
# Build locally to test
npm run build
npm run preview

# Check browser console for errors
# Check Network tab for API calls
```

## Rollback Plan

### If Contract Has Issues
1. Deploy new contract version
2. Update CONTRACT_ID in backend
3. Redeploy backend
4. Notify users

### If Backend Has Issues
1. Revert to last working version
2. Use Render dashboard to roll back
3. Check database integrity
4. Restart agents

### If Database Has Issues
1. Restore from Supabase backup
2. Verify data integrity
3. Notify users of outage
4. Clear caches

## Maintenance Schedule

- **Daily**: Check health endpoints, review logs
- **Weekly**: Check agent execution, database size
- **Monthly**: Review costs, update dependencies
- **Quarterly**: Full backup test, disaster recovery drill

## Support & Community

- GitHub Issues: Report bugs
- Discussions: Ask questions
- Stellar Developers Discord: Community support
- Email: contact@example.com

## Cost Estimation

### Stellar Testnet
- Contract deployment: ~100 XLM (~$10)
- Contract calls: ~0.1 XLM per call (~$0.01)

### Supabase
- Free tier: Up to 500MB database
- Starter: $25/month for larger databases
- Plus: $115/month for additional features

### Render
- Backend: $7-12/month for hobby tier
- Add Postgres: $15/month separate

### Vercel
- Frontend: Free tier
- Pro: $20/month for advanced features

**Total estimate: $50-100/month for production**
