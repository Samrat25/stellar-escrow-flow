# Stellar Escrow Flow - Architecture Documentation

## System Overview

Stellar Escrow Flow is a production-ready, milestone-based decentralized escrow system built on the Stellar blockchain using Soroban smart contracts. It enables secure fund management between clients and freelancers with automatic milestone approval and deadline-based fund release.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
│  - Wallet Connection (Freighter, Ledger)                         │
│  - Dashboard (Client & Freelancer Views)                         │
│  - Create Escrow with Dynamic Milestones                         │
│  - Real-time Status Updates                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express + Prisma)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Routes                                               │  │
│  │ - POST /escrow/create                                    │  │
│  │ - POST /escrow/deposit                                   │  │
│  │ - GET /escrow/:id                                        │  │
│  │ - POST /milestone/submit                                 │  │
│  │ - POST /milestone/approve|reject                         │  │
│  │ - POST /feedback/submit                                  │  │
│  │ - GET /user/:address/dashboard                           │  │
│  │ - GET /agent/status                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Services                                                 │  │
│  │ - ContractService: Soroban interactions                  │  │
│  │ - PrismaClient: Database ORM                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Automation Agents                                        │  │
│  │ - Auto-Approval Agent (5 min cron)                       │  │
│  │ - Event Sync Agent (10 min cron)                         │  │
│  │ - Feedback Analyzer Agent (30 min cron)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                          │
         │ Stellar SDK              │ Prisma + PostgreSQL
         ▼                          ▼
  ┌─────────────────┐      ┌─────────────────────┐
  │ Soroban Contract│      │ PostgreSQL Database │
  │ (Rust Wasm)     │      │ (Hosted on Supabase)│
  │                 │      │                     │
  │ - Escrow struct │      │ - Users             │
  │ - Milestone data│      │ - Escrows           │
  │ - Fund locking  │      │ - Milestones        │
  │ - Auto-release  │      │ - Feedbacks         │
  │ - Events        │      │ - Agent Logs        │
  └─────────────────┘      └─────────────────────┘
```

## Component Structure

### Smart Contract (`/contract`)
Built with Soroban SDK v21.7+ in Rust.

**Key Structs:**
- `Escrow`: Main escrow agreement containing client, freelancer, milestones, deadline
- `Milestone`: Individual milestone with amount, status, timestamps
- `EscrowState`: CREATED → FUNDED → ACTIVE → COMPLETED (or CANCELLED)
- `MilestoneStatus`: PENDING → SUBMITTED → APPROVED (or REJECTED)

**Key Functions:**
- `create_escrow()`: Initialize escrow with milestone amounts and deadline
- `deposit_funds()`: Lock funds into contract
- `submit_milestone()`: Freelancer submits completed milestone
- `approve_milestone()`: Client approves and releases funds
- `reject_milestone()`: Client rejects milestone for revision
- `auto_approve()`: Auto-approve after review window expires
- `auto_release()`: Release all pending funds when deadline passes
- `get_escrow()`: Query current escrow state

### Backend (`/backend`)

**Database Schema (PostgreSQL):**
```
User
├── walletAddress (unique)
├── role (CLIENT, FREELANCER, BOTH)
├── displayName, email
├── reputation, completedEscrows, totalTransacted
└── relations: clientEscrows, freelancerEscrows, feedbacks

Escrow
├── id, contractId (unique), escrowIdOnChain
├── clientWallet, freelancerWallet
├── totalAmount, reviewWindowDays
├── deadline (timestamp)
├── status (CREATED, FUNDED, ACTIVE, COMPLETED, CANCELLED)
├── milestone (array relation)
└── transactionLogs, feedbacks, agentLogs

Milestone
├── id, escrowId, milestoneIndex
├── description, amount
├── status (PENDING, SUBMITTED, APPROVED, REJECTED)
├── proofUrl, submittedAt, approvedAt
├── autoApproved (boolean)
└── reviewDeadline

Feedback
├── id, escrowId, userId
├── rating (1-5), comment
├── category (GENERAL, QUALITY, SPEED, PROFESSIONALISM)
└── createdAt, updatedAt

AgentLog
├── id, escrowId (optional), agentType
├── action, status, txHash
├── errorMessage, metadata
└── createdAt, updatedAt

TransactionLog
├── id, escrowId, milestoneId
├── txHash (unique), txType
├── walletAddress, amount
└── status, createdAt

IterationPlan
├── id, title, description
├── priority, feedbackCount
├── suggestions (array)
└── createdAt, updatedAt
```

**API Endpoints:**

1. **Escrow Operations**
   - `POST /escrow/create` - Create new escrow
   - `POST /escrow/deposit` - Deposit funds
   - `GET /escrow/:id` - Get escrow details
   - `GET /escrow/wallet/:address` - List user escrows

2. **Milestone Operations**
   - `POST /milestone/submit` - Submit completed milestone
   - `POST /milestone/approve` - Approve & release funds
   - `POST /milestone/reject` - Reject milestone

3. **Feedback System**
   - `POST /feedback/submit` - Submit escrow feedback
   - `GET /feedback/escrow/:id` - Get feedback on escrow
   - `GET /feedback/user/:id` - Get user reputation
   - `GET /feedback/stats` - Global statistics

4. **User Management**
   - `GET /user/:address` - Get user profile
   - `GET /user/:address/dashboard` - Dashboard data
   - `PUT /user/:address` - Update profile
   - `GET /user/:address/reputation` - Reputation score

5. **Agent Monitoring**
   - `GET /agent/status` - System status
   - `GET /agent/logs` - Agent activity logs
   - `GET /agent/pending-actions` - Items awaiting processing
   - `POST /agent/test` - Health check

### Frontend (`/frontend`)

**Pages:**
- `Index.tsx` - Landing page with features overview
- `CreateEscrow.tsx` - Dynamic milestone creation form
- `ClientDashboard.tsx` - Client view of escrows, approval interface
- `FreelancerDashboard.tsx` - Freelancer work submission
- `Dashboard.tsx` - Redirect to role-specific dashboard
- `NotFound.tsx` - 404 page

**Key Components:**
- `Navbar.tsx` - Wallet connection, navigation
- `WalletSelector.tsx` - Multi-wallet support (Freighter, Ledger)
- `EscrowCard.tsx` - Escrow display card
- `EscrowStatusBadge.tsx` - Status indicator
- `DeadlineCountdown.tsx` - Countdown timer to deadline
- `HowItWorks.tsx` - Feature explanation
- UI components from shadcn/ui

## Data Flow

### Create Escrow Flow
1. Client connects wallet
2. Input freelancer address, milestones, deadline
3. Frontend calls `POST /escrow/create`
4. Backend creates transaction, calls Soroban contract
5. Contract creates Escrow struct, emits event
6. Backend saves to database
7. Frontend shows success + explorer link

### Milestone Approval Flow
1. Freelancer submits milestone with proof URL
2. Backend updates milestone status to SUBMITTED, sets review deadline
3. Client reviews and approves OR rejects
4. If approved: Contract transfers funds, updates database
5. If rejected: Milestone reverts to PENDING for resubmission
6. Auto-approval triggers if review window expires

### Auto-Release Flow
1. Agent runs every 5 minutes
2. Checks escrows past global deadline
3. Auto-approves any submitted-but-unapproved milestones
4. Releases remaining funds to freelancer
5. Marks escrow as COMPLETED

## Security Considerations

1. **Contract Security**
   - All funds locked in contract until approval
   - No reentrancy issues (token transfer at end)
   - Auth checks ensure only authorized parties act
   - Prevent double-spending with status checks

2. **Backend Security**
   - Input validation on all endpoints
   - Stellar address format verification
   - Wallet address confirmation for operations
   - Transaction hash verification
   - Rate limiting recommended but not implemented

3. **Frontend Security**
   - Wallet signing for all transactions
   - No private keys stored locally
   - HTTPS required in production
   - localStorage only for non-sensitive data

4. **Database Security**
   - Use Supabase with RLS (Row Level Security)
   - Encrypt sensitive fields
   - Backup and recovery procedures

## Scalability & Performance

1. **Database**
   - Use PostgreSQL (Supabase) for reliability
   - Indexing on commonly queried fields
   - Connection pooling with Prisma

2. **Backend**
   - Stateless design for horizontal scaling
   - Agent jobs can run in separate containers
   - Cache frequently accessed data (Redis optional)

3. **Frontend**
   - React Query for data caching
   - Lazy loading for large lists
   - Code splitting with Vite

4. **Contract**
   - One contract per escrow is more flexible than single global contract
   - Consider contract pooling for cost optimization

## Deployment

See DEPLOYMENT_GUIDE.md for detailed instructions.

### Production Checklist
- [ ] Contract deployed to Stellar testnet/mainnet
- [ ] Backend running on Render, Railway, or similar
- [ ] PostgreSQL database on Supabase
- [ ] Frontend deployed to Vercel, Netlify, or similar
- [ ] Environment variables configured correctly
- [ ] Agents running continuously
- [ ] Monitoring and alerting set up
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Database backups automated
