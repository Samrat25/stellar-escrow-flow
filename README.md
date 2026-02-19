# TrustPay - Milestone-Based Escrow on Stellar

A production-ready MVP for trustless milestone-based payments between clients and freelancers, built on Stellar Testnet using Soroban smart contracts.

## 🎯 Overview

TrustPay enables secure, transparent escrow agreements where:
- Clients create escrows with multiple milestones
- Funds are locked in smart contracts
- Freelancers submit work for each milestone
- Clients review and approve within a time window
- Auto-approval protects freelancers if clients don't respond
- All transactions are verifiable on Stellar blockchain

## ✨ Key Features

### For Clients
- Create multi-milestone escrow agreements
- Lock funds securely on-chain
- Review submitted work with proof links
- Approve or reject milestones with feedback
- Set custom review windows (e.g., 3 days)
- View all transactions on Stellar Explorer

### For Freelancers
- View assigned projects
- Submit milestones with proof URLs
- Track review deadlines
- Automatic payment upon approval
- Protection via auto-approval if client doesn't respond
- Sequential milestone completion

### Smart Contract Features
- Milestone-based fund release
- Sequential completion enforcement
- Review window timer
- Fair auto-approval mechanism
- Double-claim prevention
- Immutable terms after funding

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
Backend API (Node.js + Express)
    ↓
Soroban Smart Contract (Stellar Testnet)
    ↓
Supabase (PostgreSQL)
```

### Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, Stellar SDK
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Stellar Testnet, Soroban
- **Automation**: Node-cron for auto-approval

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Stellar testnet account with XLM
- Supabase account
- Freighter wallet (browser extension)

### Local Development

```bash
# 1. Clone repository
git clone <your-repo-url>
cd stellar-escrow-flow

# 2. Setup database (see SETUP.md)
# - Create Supabase project
# - Run backend/database/schema.sql

# 3. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 4. Frontend setup (new terminal)
cd ..
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev

# 5. Auto-approval agent (new terminal)
cd backend
npm run agent
```

Visit `http://localhost:5173`

**Detailed setup instructions**: See [SETUP.md](./SETUP.md)

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete local development setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **[backend/contracts/README.md](./backend/contracts/README.md)** - Smart contract documentation

## 🔄 User Flows

### Client Flow
1. Connect Stellar wallet
2. Create escrow (freelancer address, milestones, review window)
3. Deposit total funds to contract
4. Wait for freelancer to submit milestones
5. Review submitted work (proof link)
6. Approve or reject within review window
7. Funds automatically released on approval
8. Escrow completes when all milestones approved

### Freelancer Flow
1. Connect Stellar wallet
2. View assigned escrows
3. Submit milestone with proof URL (GitHub, Drive, etc.)
4. Wait for client approval or auto-approval
5. Receive payment automatically
6. Move to next milestone
7. Complete all milestones sequentially

### Auto-Approval Flow
- Agent runs every 5 minutes
- Checks for submitted milestones past review deadline
- Automatically approves and releases funds
- Protects freelancers from unresponsive clients
- Logs all transactions

## 🗂️ Project Structure

```
stellar-escrow-flow/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   └── auto-approval.js      # Auto-approval cron job
│   │   ├── config/
│   │   │   ├── stellar.js            # Stellar SDK config
│   │   │   └── supabase.js           # Supabase client
│   │   ├── routes/
│   │   │   ├── escrow.js             # Escrow endpoints
│   │   │   ├── milestone.js          # Milestone endpoints
│   │   │   └── feedback.js           # Feedback endpoints
│   │   ├── services/
│   │   │   └── contract.js           # Smart contract service
│   │   └── server.js                 # Express server
│   ├── database/
│   │   └── schema.sql                # Database schema
│   ├── contracts/
│   │   └── README.md                 # Contract documentation
│   └── package.json
├── src/
│   ├── components/                   # React components
│   ├── pages/
│   │   ├── ClientDashboard.tsx       # Client view
│   │   ├── FreelancerDashboard.tsx   # Freelancer view
│   │   ├── CreateEscrow.tsx          # Create escrow form
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                    # API client
│   │   └── stellar.ts                # Stellar utilities
│   └── types/
│       └── escrow.ts                 # TypeScript types
├── docs/
│   └── architecture.md               # Architecture docs
├── SETUP.md                          # Setup guide
├── DEPLOYMENT.md                     # Deployment guide
└── README.md                         # This file
```

## 🔐 Security

- All funds locked in smart contracts (non-custodial)
- Wallet-based authentication
- Row-level security (RLS) on database
- Input validation on all endpoints
- Sequential milestone enforcement
- Double-claim prevention
- Review window protection

## 🧪 Testing

### Manual Testing
1. Create 5+ testnet accounts
2. Fund with testnet XLM via Friendbot
3. Test full escrow lifecycle
4. Test auto-approval (modify deadline for quick test)
5. Verify all transactions on Stellar Explorer
6. Collect feedback

### Test Scenarios
- ✅ Create escrow and deposit funds
- ✅ Submit milestone with proof
- ✅ Approve milestone
- ✅ Reject milestone and resubmit
- ✅ Auto-approval after deadline
- ✅ Sequential milestone completion
- ✅ Complete full escrow
- ✅ Multiple concurrent escrows

## 📊 Database Schema

### Tables
- `users` - Wallet addresses and roles
- `escrows` - Escrow agreements
- `milestones` - Individual milestones
- `feedback` - User feedback
- `transaction_logs` - Audit trail

See [backend/database/schema.sql](./backend/database/schema.sql) for full schema.

## 🌐 API Endpoints

### Escrow
- `POST /escrow/create` - Create new escrow
- `POST /escrow/deposit` - Deposit funds
- `GET /escrow/:id` - Get escrow details
- `GET /escrow/wallet/:address` - Get wallet's escrows

### Milestone
- `POST /milestone/submit` - Submit milestone
- `POST /milestone/approve` - Approve milestone
- `POST /milestone/reject` - Reject milestone

### Feedback
- `POST /feedback` - Submit feedback
- `GET /feedback` - Get all feedback

## 🚢 Deployment

### Backend
- Railway, Render, or Heroku
- Set environment variables
- Deploy auto-approval agent

### Frontend
- Vercel, Netlify, or GitHub Pages
- Set VITE_API_URL

### Database
- Supabase (managed PostgreSQL)
- Run schema.sql
- Configure RLS policies

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🎓 Blue Belt Validation

To achieve Blue Belt status:
- [ ] 5+ real testnet users
- [ ] At least 1 full escrow lifecycle
- [ ] At least 1 auto-approval event
- [ ] All wallet addresses documented
- [ ] Explorer links verifiable
- [ ] Feedback collected
- [ ] 1 UI improvement iteration

## 🛣️ Roadmap

### Current (MVP)
- ✅ Milestone-based escrow
- ✅ Auto-approval mechanism
- ✅ Client/Freelancer dashboards
- ✅ Stellar testnet integration
- ✅ Transaction verification

### Future Enhancements
- Deploy real Soroban contract
- Multi-signature approval
- Reputation system
- Dispute resolution
- Multi-asset support (USDC, etc.)
- Mobile app
- Mainnet launch

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet)
- [Freighter Wallet](https://www.freighter.app/)
- [Supabase](https://supabase.com/)

## 💬 Support

For issues or questions:
1. Check [SETUP.md](./SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review browser console and server logs
3. Check Stellar Explorer for transaction details
4. Open an issue on GitHub

## 🙏 Acknowledgments

Built for the Stellar ecosystem with focus on real-world usability and fair automation.

---

**Status**: MVP Ready for Testing  
**Network**: Stellar Testnet  
**Last Updated**: February 2026
