# TrustPay Backend

Node.js + Express backend for TrustPay milestone-based escrow system.

## Structure

```
backend/
├── src/
│   ├── agents/
│   │   └── auto-approval.js      # Cron job for auto-approving expired milestones
│   ├── config/
│   │   ├── stellar.js            # Stellar SDK configuration
│   │   └── supabase.js           # Supabase client setup
│   ├── routes/
│   │   ├── escrow.js             # Escrow CRUD endpoints
│   │   ├── milestone.js          # Milestone management endpoints
│   │   └── feedback.js           # Feedback collection endpoints
│   ├── services/
│   │   └── contract.js           # Smart contract interaction service
│   └── server.js                 # Express server entry point
├── database/
│   └── schema.sql                # PostgreSQL schema for Supabase
├── contracts/
│   └── README.md                 # Soroban contract documentation
├── package.json
├── .env.example
└── README.md                     # This file
```

## Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Stellar testnet account

### Install
```bash
npm install
```

### Configure
```bash
cp .env.example .env
```

Edit `.env`:
```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

PORT=3001
NODE_ENV=development
```

### Run
```bash
# Development (auto-restart)
npm run dev

# Production
npm start

# Auto-approval agent
npm run agent
```

## API Endpoints

### Health
```
GET /health
```

### Escrow
```
POST   /escrow/create              Create new escrow
POST   /escrow/deposit             Deposit funds to escrow
GET    /escrow/:id                 Get escrow by ID
GET    /escrow/wallet/:address     Get all escrows for wallet
```

### Milestone
```
POST   /milestone/submit           Submit milestone with proof
POST   /milestone/approve          Approve milestone and release funds
POST   /milestone/reject           Reject milestone with reason
```

### Feedback
```
POST   /feedback                   Submit user feedback
GET    /feedback                   Get all feedback
```

## Services

### Contract Service
Handles all smart contract interactions:
- `createEscrow()` - Deploy new escrow contract
- `depositFunds()` - Lock funds in contract
- `submitMilestone()` - Mark milestone as submitted
- `approveMilestone()` - Approve and release funds
- `rejectMilestone()` - Reject milestone
- `autoApproveMilestone()` - Auto-approve expired milestone
- `getEscrowState()` - Query contract state

Currently uses mock implementation. Replace with real Soroban contract calls in production.

### Auto-Approval Agent
Runs every 5 minutes to:
1. Query submitted milestones past review deadline
2. Call `autoApproveMilestone()` on contract
3. Update database status
4. Log transaction hashes

## Database

Schema in `database/schema.sql`. Run in Supabase SQL Editor.

Tables:
- `users` - Wallet addresses and roles
- `escrows` - Escrow agreements
- `milestones` - Individual milestones
- `feedback` - User feedback
- `transaction_logs` - Audit trail

## Testing

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
      {"description": "Milestone 1", "amount": "1000"}
    ],
    "reviewWindowDays": 3
  }'
```

## Deployment

### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Render
1. New Web Service
2. Build: `cd backend && npm install`
3. Start: `cd backend && npm start`
4. Add environment variables

### Heroku
```bash
heroku create trustpay-backend
heroku config:set SUPABASE_URL=...
git subtree push --prefix backend heroku main
```

## Environment Variables

Required:
- `STELLAR_NETWORK` - Network (testnet/mainnet)
- `STELLAR_HORIZON_URL` - Horizon API URL
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

Optional:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Security

- Service role key for database access
- Input validation on all endpoints
- CORS enabled for frontend
- RLS policies on database
- No wallet private keys stored

## Monitoring

Check logs for:
- API requests
- Auto-approval runs
- Database errors
- Contract interactions

## Future Enhancements

- Real Soroban contract integration
- Rate limiting
- Request logging
- Error tracking (Sentry)
- API documentation (Swagger)
- Unit tests
- Integration tests
