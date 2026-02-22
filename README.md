# 🌟 Stellar Escrow Flow
## Production-Ready Milestone-Based Decentralized Escrow on Stellar Blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.org)
[![Smart Contract: Soroban](https://img.shields.io/badge/SC-Soroban-purple)](https://soroban.stellar.org)

## Overview

Stellar Escrow Flow is a **Blue Belt compliant** MVP that demonstrates a complete milestone-based escrow system on Stellar blockchain. It enables secure fund management between clients and freelancers with:

✨ **Key Features:**
- 🔐 Smart contracts lock funds until milestone approval
- 📋 Multiple milestone tracking with sequential approval
- ⏰ Automatic fund release after deadline passes
- 👤 User profiles with reputation system
- ⭐ Dual feedback system (Client & Freelancer reviews)
- 🎡 Animated circular review display on landing page
- 📊 Comprehensive reputation tracking
- 🤖 Intelligent automation agents for approvals and state sync
- 💾 Supabase integration for metadata storage
- 🎨 Modern React UI with real-time updates
- 📱 Full wallet support (Freighter, Ledger)

## Quick Start

### One-Line Setup
```bash
bash setup.sh  # Linux/Mac
setup.bat      # Windows
```

### Manual Setup (5 minutes)

**1. Smart Contract**
```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
./deploy.sh testnet YOUR_STELLAR_ADDRESS
```

**2. Backend**
```bash
cd backend
npm install && npm run prisma:migrate
npm run dev
```

**3. Frontend** (in another terminal)
```bash
cd frontend
npm install && npm run dev
```

**4. Agents** (optional, in separate terminals)
```bash
cd backend
npm run agent          # Auto-approval
npm run agent:sync     # Event sync
npm run agent:feedback # Feedback
```

## Architecture

```
Frontend (React)           Backend (Node.js)           Contract (Soroban)
├─ Create Escrow    →  ├─ API Routes         →   ├─ Fund Locking
├─ Dashboard        →  ├─ Services           →   ├─ Milestone State
├─ Milestone Panel  →  ├─ Agents             →   └─ Auto-Release
└─ Feedback        →  └─ PostgreSQL         
                                 ↑
                            Supabase Database
```

See [docs/architecture.md](docs/architecture.md) for detailed design.

## Project Structure

```
stellar-escrow-flow/
├── contract/              # Soroban Smart Contract
│   ├── src/lib.rs        # Core contract logic
│   └── Cargo.toml
│
├── backend/              # Express + Prisma Backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── agents/       # Automation
│   │   └── config/
│   ├── prisma/schema.prisma
│   └── package.json
│
├── frontend/             # React + Vite  
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── vite.config.ts
│
└── docs/                 # Documentation
    ├── architecture.md
    └── DEPLOYMENT_GUIDE.md
```

## API Endpoints

### Escrow Management
```
POST /escrow/create              - Create escrow with milestones
POST /escrow/deposit             - Deposit funds to contract
GET /escrow/:id                  - Get escrow status
GET /escrow/wallet/:address      - List user escrows
```

### Milestone Processing
```
POST /milestone/submit           - Submit completed work
POST /milestone/approve          - Approve & release funds
POST /milestone/reject           - Reject with feedback
```

### Feedback & Reputation
```
POST /feedback/create            - Create review for completed milestone
GET /feedback/user/:wallet       - Get all reviews for a user
GET /feedback/latest             - Get latest 10 reviews (landing page)
GET /feedback/client             - Get reviews given TO clients
GET /feedback/freelancer         - Get reviews given TO freelancers
```

### User Profile
```
GET /profile/:wallet             - Get user profile with stats
POST /profile/update             - Update user profile (username, bio, avatar, role)
```

### User & Agent
```
GET /user/:address/dashboard     - User dashboard data
GET /agent/status                - Agent system status
GET /agent/logs                  - Recent agent activity
```

## Database Schema

PostgreSQL on Supabase with tables:
- **users** - Profiles, reputation, stats (username, bio, avatar, role)
- **escrows** - Agreements with deadlines
- **milestones** - Work items with status
- **feedback** - Dual review system (CLIENT_REVIEW, FREELANCER_REVIEW)
- **transaction_logs** - Audit trail
- **agent_logs** - Automation activity

## Smart Contract Functions

```rust
create_escrow()        # Setup escrow with milestones & deadline
deposit_funds()        # Lock funds in contract
submit_milestone()     # Freelancer submits work
approve_milestone()    # Client approves & releases payment
reject_milestone()     # Client rejects for revision
auto_approve()         # Automatic approval after deadline
auto_release()         # Release all funds when global deadline passes
get_escrow()           # Query current state
```

## User Experience Flow

1. **Connect Wallet** → Auto-create profile
2. **Edit Profile** → Set username, bio, avatar, role (Client/Freelancer)
3. **Create Milestone** → Client sets up work agreement
4. **Fund Milestone** → Client locks XLM in smart contract
5. **Submit Work** → Freelancer uploads deliverables
6. **Approve & Release** → Client approves, funds transfer automatically
7. **Leave Review** → Both parties review each other (1-5 stars)
8. **Build Reputation** → Reviews displayed on profile and landing page

## Feedback System

### Dual Review System
- **Client reviews Freelancer** after milestone completion
- **Freelancer reviews Client** after milestone completion
- One review per milestone per role
- Prevents duplicate and self-reviews
- Average rating calculated automatically

### Animated Orbit Display
- Landing page shows latest 10 reviews
- Mercury orbit style with glassmorphism
- Smooth continuous rotation
- Pause on hover for reading
- Real-time updates from Supabase

## Automation Agents

### 1. Auto-Approval Agent (5 min intervals)
- Checks for milestones past review deadline
- Auto-approves and releases funds
- Auto-releases entire escrow when deadline passes
- Logs all actions

### 2. Event Sync Agent (10 min intervals)
- Synchronizes contract events with database
- Ensures data consistency
- Fixes any discrepancies

### 3. Feedback Analyzer (30 min intervals)
- Analyzes collected feedback
- Generates improvement suggestions
- Creates iteration plans when threshold reached

## Environment Variables

**Backend (.env)**
```
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
CONTRACT_ID=C...
DATABASE_URL=postgresql://...
PORT=3001
USE_REAL_CONTRACT=true
ENABLE_AUTO_APPROVAL_AGENT=true
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001
VITE_STELLAR_NETWORK=testnet
```

See `.env.example` files for complete reference.

## Blue Belt Compliance

✅ **MVP Requirements Met:**
- Support for 5+ testnet users
- Complete escrow creation workflow
- Milestone-based approval system
- Automatic deadline-based release
- Feedback collection & storage
- Explorer verification capability
- Agent automation implemented

✅ **Production Quality:**
- Comprehensive error handling
- Full documentation
- Security best practices
- Scalable architecture
- Database backups
- Monitoring & logging

## Deployment

### Testnet (Free)
```bash
cd contract && ./deploy.sh testnet YOUR_ADDRESS
```

### Staging/Production
See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for:
- Supabase setup
- Backend deployment (Render)
- Frontend deployment (Vercel)
- Custom domain configuration
- SSL/HTTPS setup

**Estimated monthly costs:**
- Supabase: $25-115
- Render: $7-15
- Vercel: Free or $20
- **Total: $32-150/month**

## Testing

```bash
# Run all tests
cd contract && cargo test
cd backend && npm test
cd frontend && npm test

# Manual testing
npm run dev  # All services
```

## Security

🔒 **Smart Contract**
- Funds locked until approved
- No reentrancy issues
- Auth checks on all operations

🔐 **Backend**
- Input validation
- Stellar address verification
- Transaction hash confirmation

🛡️ **Frontend**
- No private key storage
- Wallet signing for all transactions
- HTTPS required

## Roadmap

- [ ] Admin analytics dashboard
- [ ] USDC & multi-currency support
- [ ] Escrow dispute/arbitration
- [ ] Mobile app (React Native)
- [ ] Mainnet deployment
- [ ] Governance token

## Support & Community

- 📖 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/yourusername/stellar-escrow-flow/issues)
- 💬 [Stellar Discord](https://discord.gg/stellar)

## License

MIT License - [LICENSE](LICENSE)

## Acknowledgments

- [Stellar SDK](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Deploy it. Customize it. Build something amazing.** 🚀
