# TrustPay - Quick Reference Guide

## 🚀 Quick Start Commands

### First Time Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# Frontend (new terminal)
cd ..
npm install
cp .env.example .env
# Edit .env
npm run dev

# Agent (new terminal)
cd backend
npm run agent
```

### Daily Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Agent
cd backend && npm run agent
```

## 📝 Common Tasks

### Create Test Accounts
1. Visit https://laboratory.stellar.org/#account-creator?network=test
2. Click "Generate keypair"
3. Copy public key (G...)
4. Click "Fund account with Friendbot"
5. Save secret key (S...) securely

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Create escrow
curl -X POST http://localhost:3001/escrow/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientWallet": "GCEZ...",
    "freelancerWallet": "GBDE...",
    "milestones": [
      {"description": "Design", "amount": "1000"},
      {"description": "Development", "amount": "2000"}
    ],
    "reviewWindowDays": 3
  }'

# Get escrow
curl http://localhost:3001/escrow/ESCROW_ID

# Get wallet escrows
curl http://localhost:3001/escrow/wallet/GCEZ...
```

### Database Queries
```sql
-- View all escrows
SELECT * FROM escrows ORDER BY created_at DESC;

-- View milestones
SELECT e.id, m.milestone_index, m.description, m.status, m.review_deadline
FROM milestones m
JOIN escrows e ON m.escrow_id = e.id
ORDER BY e.created_at DESC;

-- Check auto-approval candidates
SELECT * FROM milestones 
WHERE status = 'SUBMITTED' 
AND review_deadline < NOW();

-- Get statistics
SELECT * FROM get_escrow_stats();
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Check .env exists
cat .env

# Test Supabase connection
node -e "console.log(process.env.SUPABASE_URL)"
```

### Frontend won't start
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache
rm -rf node_modules/.vite

# Check .env
cat .env
```

### Wallet won't connect
- Install Freighter extension
- Switch to Testnet in Freighter settings
- Refresh page
- Check browser console

### API calls fail
- Verify backend running: `curl http://localhost:3001/health`
- Check VITE_API_URL in .env
- Check browser Network tab
- Verify CORS enabled

## 📊 Monitoring

### Check Backend Health
```bash
curl http://localhost:3001/health
```

### Check Agent Logs
Look for in terminal:
```
[timestamp] Running auto-approval check...
Found X milestone(s) to auto-approve
✅ Auto-approved milestone Y
```

### Check Database
```sql
-- Recent transactions
SELECT * FROM transaction_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Active escrows
SELECT * FROM escrows 
WHERE status IN ('FUNDED', 'ACTIVE');
```

## 🔗 Useful Links

### Development
- Local Frontend: http://localhost:5173
- Local Backend: http://localhost:3001
- Backend Health: http://localhost:3001/health

### Stellar
- Laboratory: https://laboratory.stellar.org/
- Friendbot: https://laboratory.stellar.org/#account-creator?network=test
- Explorer: https://stellar.expert/explorer/testnet
- Horizon: https://horizon-testnet.stellar.org

### Tools
- Supabase: https://supabase.com
- Freighter: https://www.freighter.app/

## 🎯 Testing Workflow

### Full Lifecycle Test
1. **Setup**
   - Create 2 test accounts (client + freelancer)
   - Fund both with Friendbot
   - Connect client wallet

2. **Create Escrow**
   - Go to /create
   - Enter freelancer address
   - Add 2-3 milestones
   - Set review window (3 days)
   - Submit

3. **Submit Milestone**
   - Switch to freelancer wallet
   - Go to /dashboard/freelancer
   - Click "Submit Milestone"
   - Enter proof URL
   - Submit

4. **Approve Milestone**
   - Switch to client wallet
   - Go to /dashboard/client
   - Click "Approve"
   - Verify transaction

5. **Test Auto-Approval**
   - Create new escrow with 1-day window
   - Submit milestone
   - Modify deadline in database:
     ```sql
     UPDATE milestones 
     SET review_deadline = NOW() - INTERVAL '1 hour'
     WHERE id = 'MILESTONE_ID';
     ```
   - Wait for agent (or restart agent)
   - Verify auto-approval

6. **Complete Escrow**
   - Submit remaining milestones
   - Approve all
   - Verify escrow status = COMPLETED

## 📦 Build & Deploy

### Build Frontend
```bash
npm run build
npm run preview  # Test production build
```

### Build Backend
```bash
cd backend
npm start  # Production mode
```

### Deploy
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide

Quick deploy:
```bash
# Vercel (Frontend)
vercel

# Railway (Backend)
# Push to GitHub, connect in Railway dashboard
```

## 🔐 Environment Variables

### Backend (.env)
```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## 🎨 UI Components

### Key Pages
- `/` - Landing page
- `/dashboard/client` - Client dashboard
- `/dashboard/freelancer` - Freelancer dashboard
- `/create` - Create escrow form
- `/feedback` - Feedback page

### Key Components
- `Navbar` - Navigation with wallet connection
- `EscrowCard` - Escrow display card
- `DeadlineCountdown` - Review deadline timer
- `EscrowStatusBadge` - Status indicator

## 📱 Wallet Integration

### Connect Wallet
```typescript
import { connectWallet } from '@/lib/stellar';

const address = await connectWallet();
```

### Check Address Format
```typescript
import { isValidStellarAddress } from '@/lib/stellar';

if (isValidStellarAddress(address)) {
  // Valid
}
```

### Get Explorer URL
```typescript
import { getExplorerUrl } from '@/lib/stellar';

const url = getExplorerUrl(txHash);
```

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "feat: description"

# Push
git push origin feature/your-feature

# Create PR on GitHub
```

## 📚 Documentation

- **README.md** - Project overview
- **SETUP.md** - Local setup guide
- **DEPLOYMENT.md** - Deployment guide
- **IMPLEMENTATION_SUMMARY.md** - What was built
- **QUICK_REFERENCE.md** - This file
- **docs/architecture.md** - System architecture
- **backend/contracts/README.md** - Contract docs

## 🆘 Getting Help

1. Check this quick reference
2. Read SETUP.md for detailed setup
3. Check browser console for errors
4. Check backend terminal for errors
5. Check Supabase logs
6. Review Stellar Explorer for transactions
7. Check agent logs for auto-approval issues

## 💡 Tips

- Use multiple browser profiles for testing different wallets
- Keep agent running in background during development
- Use Stellar Explorer to verify all transactions
- Test auto-approval with modified deadlines in DB
- Document all test wallet addresses
- Clear browser cache if wallet connection issues
- Use Postman/curl to test API directly
- Check database directly in Supabase dashboard

## ⚡ Performance

- Backend typically responds in <100ms
- Frontend loads in <2s
- Agent checks every 5 minutes
- Database queries optimized with indexes
- Transaction confirmation ~5 seconds on testnet

## 🎯 Success Metrics

- [ ] Backend running without errors
- [ ] Frontend loads successfully
- [ ] Wallet connects properly
- [ ] Can create escrow
- [ ] Can submit milestone
- [ ] Can approve milestone
- [ ] Auto-approval works
- [ ] All transactions on Explorer
- [ ] 5+ users tested
- [ ] Feedback collected

---

**Quick Start**: `cd backend && npm run dev` + `npm run dev` + `cd backend && npm run agent`  
**Test**: Create escrow → Submit → Approve → Verify on Explorer  
**Deploy**: See DEPLOYMENT.md
