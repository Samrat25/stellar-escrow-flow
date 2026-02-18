# TrustPay — Architecture Document

## Overview

TrustPay is a milestone-based decentralized escrow system built on Stellar's Soroban smart contract platform. It enables trustless payments between clients and freelancers with verifiable on-chain transactions.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            React + Vite + TypeScript             │
│         TailwindCSS + Framer Motion              │
│              Stellar Wallet Kit                  │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
┌─────────▼───────┐ ┌──────▼──────────────┐
│  Soroban Smart  │ │  Backend (Edge Fn)  │
│    Contract     │ │  Stellar SDK        │
│  (Stellar       │ │  Supabase Client    │
│   Testnet)      │ └──────┬──────────────┘
└─────────────────┘        │
                    ┌──────▼──────────────┐
                    │    Supabase         │
                    │   PostgreSQL        │
                    │  (users, escrows,   │
                    │   milestones,       │
                    │   feedback)         │
                    └─────────────────────┘
```

## Smart Contract Architecture

**Language:** Rust (Soroban SDK)  
**Network:** Stellar Testnet  

### Data Structures

- **Escrow**: Contains client/freelancer addresses, total amount, milestone vector, deadline, state
- **Milestone**: Amount, status enum, timestamps
- **EscrowState**: CREATED → FUNDED → SUBMITTED → APPROVED/DISPUTED → COMPLETED

### Contract Functions

| Function | Description |
|----------|-------------|
| `create_escrow` | Initialize escrow with milestones and deadline |
| `deposit_funds` | Lock XLM into contract |
| `submit_milestone` | Freelancer marks milestone complete |
| `approve_milestone` | Client approves, partial release |
| `reject_milestone` | Client rejects milestone |
| `auto_release` | Release funds if deadline passed |
| `get_escrow` | Read escrow state |

### Security Rules

- Only client can approve/reject
- Only freelancer can submit
- Funds locked until explicit approval or deadline expiry
- Double-claim prevention via status checks
- Events emitted for all state transitions

## Backend Architecture

**Runtime:** Supabase Edge Functions (Deno)  
**SDK:** @stellar/stellar-sdk  

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /create-escrow | Deploy contract + store metadata |
| POST | /deposit | Trigger deposit transaction |
| POST | /submit-milestone | Submit milestone |
| POST | /approve | Approve + release funds |
| POST | /reject | Reject milestone |
| GET | /escrow/:id | Get escrow details |
| POST | /feedback | Store user feedback |
| GET | /agent-status | Check agent health |

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| wallet_address | text | Stellar public key |
| role | enum | client / freelancer |
| reputation | int | Reputation score |
| created_at | timestamp | Registration time |

### escrows
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | text | Soroban contract address |
| client_wallet | text | Client Stellar address |
| freelancer_wallet | text | Freelancer Stellar address |
| total_amount | numeric | Total XLM locked |
| status | enum | Escrow state |
| created_at | timestamp | Creation time |

### milestones
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| escrow_id | uuid | FK → escrows |
| milestone_number | int | Order index |
| amount | numeric | XLM for this milestone |
| status | enum | Milestone state |
| submitted_at | timestamp | Submission time |
| approved_at | timestamp | Approval time |

### feedback
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| wallet_address | text | Submitter's address |
| feedback_text | text | Feedback content |
| rating | int | 1-5 rating |
| created_at | timestamp | Submission time |

## Agentic Automation

### 1. Auto-Release Agent
- Runs every 5 minutes via pg_cron
- Queries escrows past deadline with unapproved milestones
- Calls `auto_release()` on contract
- Logs transaction hash to DB

### 2. Escrow Sync Agent
- Listens to Soroban contract events via Horizon streaming
- Updates Supabase escrow/milestone state in real-time

### 3. Feedback Analyzer Agent
- Triggered when feedback count ≥ 5
- Performs sentiment analysis
- Generates improvement suggestions
- Stores iteration plan

## Security Considerations

1. **Smart Contract**: All funds locked on-chain; no custodial risk
2. **Wallet Auth**: Freighter wallet signs all transactions client-side
3. **RLS Policies**: Supabase tables protected by wallet-address-based RLS
4. **Input Validation**: All user inputs validated with Zod schemas
5. **CORS**: Edge functions configured with proper CORS headers

## Scalability

- Soroban contracts are lightweight and horizontally scalable
- Supabase handles DB scaling automatically
- Edge functions are serverless and auto-scale
- Frontend deployed as static assets (CDN-ready)

## Fee Structure

- Stellar Testnet: No real fees (test XLM)
- Production: ~0.00001 XLM per transaction (Stellar base fee)
- Platform fee: Configurable percentage per escrow (future feature)
