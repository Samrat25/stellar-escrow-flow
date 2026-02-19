# TrustPay MVP Upgrade Plan

## Overview
Upgrading the prototype into a production-ready milestone-based escrow MVP on Stellar Testnet.

## Core Principles
- Real-world freelance workflow
- Clear client/freelancer separation
- Fair automation (auto-approval only)
- No overengineering
- Blockchain as source of truth

## Implementation Phases

### Phase 1: Backend Infrastructure ✓
- Node.js + Express API
- Stellar SDK integration
- Supabase client setup
- Environment configuration

### Phase 2: Database Schema ✓
- Users table with wallet auth
- Escrows with contract tracking
- Milestones with proof URLs
- Feedback system
- Transaction logs

### Phase 3: Smart Contract Structure ✓
- Escrow state machine
- Sequential milestone logic
- Review window enforcement
- Auto-approval mechanism
- Event emission

### Phase 4: Frontend Refactor ✓
- Separate client/freelancer dashboards
- Role-based UI components
- Real-time status updates
- Transaction hash display
- Stellar Explorer integration

### Phase 5: Automation Agent ✓
- Auto-approval cron job
- Review window checker
- Transaction logger

### Phase 6: Testing & Validation
- 5+ testnet users
- Full lifecycle test
- Auto-approval verification
- Feedback collection

## Key Features

### Client Flow
1. Connect wallet
2. Create escrow (freelancer address, milestones, review window)
3. Deposit funds to contract
4. Review submitted milestones
5. Approve/reject within review window
6. View transaction history

### Freelancer Flow
1. Connect wallet
2. View assigned escrows
3. Submit milestone with proof
4. Wait for approval or auto-approval
5. Receive payment automatically
6. View transaction history

### Smart Contract Logic
- Sequential milestone completion
- Review window timer (e.g., 3 days)
- Auto-approval if client doesn't respond
- One-time release per milestone
- State transitions: CREATED → FUNDED → ACTIVE → COMPLETED

### Automation
- Runs every 5 minutes
- Checks expired review windows
- Calls auto-approve on contract
- Logs all transactions

## Security Measures
- Wallet-based authentication
- No custodial funds (all on-chain)
- Double-claim prevention
- Input validation
- RLS policies on database

## Deployment Checklist
- [ ] Backend deployed (Railway/Render)
- [ ] Supabase project configured
- [ ] Smart contract deployed to testnet
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Automation agent running
- [ ] 5+ test users onboarded
- [ ] Full lifecycle tested
- [ ] Feedback collected
- [ ] Documentation complete
