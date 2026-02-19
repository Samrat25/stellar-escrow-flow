# TrustPay Soroban Smart Contract

## Overview
This directory contains the Soroban smart contract for milestone-based escrow on Stellar.

## Contract Structure

### Data Types

```rust
pub enum EscrowState {
    Created,
    Funded,
    Active,
    Completed,
    Cancelled,
}

pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Rejected,
}

pub struct Milestone {
    pub amount: i128,
    pub status: MilestoneStatus,
    pub submitted_at: Option<u64>,
    pub approved_at: Option<u64>,
}

pub struct Escrow {
    pub id: BytesN<32>,
    pub client: Address,
    pub freelancer: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub review_window_seconds: u64,
    pub state: EscrowState,
    pub created_at: u64,
}
```

### Contract Functions

#### `create_escrow`
```rust
pub fn create_escrow(
    env: Env,
    client: Address,
    freelancer: Address,
    milestone_amounts: Vec<i128>,
    review_window_days: u32,
) -> BytesN<32>
```
Creates a new escrow agreement.

**Requirements:**
- Client and freelancer must be different addresses
- At least one milestone required
- Review window must be >= 1 day

**Returns:** Escrow ID

**Emits:** `EscrowCreated` event

#### `deposit_funds`
```rust
pub fn deposit_funds(
    env: Env,
    escrow_id: BytesN<32>,
) -> Result<(), Error>
```
Client deposits total amount into contract.

**Requirements:**
- Caller must be client
- Escrow must be in Created state
- Amount must match total_amount

**State Change:** Created → Funded → Active

**Emits:** `FundsDeposited` event

#### `submit_milestone`
```rust
pub fn submit_milestone(
    env: Env,
    escrow_id: BytesN<32>,
    milestone_index: u32,
) -> Result<(), Error>
```
Freelancer submits milestone for review.

**Requirements:**
- Caller must be freelancer
- Escrow must be Active or Funded
- Milestone must be Pending or Rejected
- Previous milestone must be Approved (sequential)

**State Change:** Milestone → Submitted, starts review timer

**Emits:** `MilestoneSubmitted` event

#### `approve_milestone`
```rust
pub fn approve_milestone(
    env: Env,
    escrow_id: BytesN<32>,
    milestone_index: u32,
) -> Result<(), Error>
```
Client approves milestone and releases funds.

**Requirements:**
- Caller must be client
- Milestone must be Submitted
- Within or after review window

**Actions:**
- Transfer milestone amount to freelancer
- Mark milestone as Approved
- If all milestones approved, mark escrow Completed

**Emits:** `MilestoneApproved` event

#### `reject_milestone`
```rust
pub fn reject_milestone(
    env: Env,
    escrow_id: BytesN<32>,
    milestone_index: u32,
) -> Result<(), Error>
```
Client rejects milestone.

**Requirements:**
- Caller must be client
- Milestone must be Submitted
- Within review window

**State Change:** Milestone → Rejected (can be resubmitted)

**Emits:** `MilestoneRejected` event

#### `auto_approve_milestone`
```rust
pub fn auto_approve_milestone(
    env: Env,
    escrow_id: BytesN<32>,
    milestone_index: u32,
) -> Result<(), Error>
```
Auto-approves milestone if review window expired.

**Requirements:**
- Milestone must be Submitted
- Review window must be expired
- Client has not responded

**Actions:**
- Same as approve_milestone
- Marks as auto-approved

**Emits:** `MilestoneAutoApproved` event

#### `get_escrow`
```rust
pub fn get_escrow(
    env: Env,
    escrow_id: BytesN<32>,
) -> Escrow
```
Returns escrow details.

### Events

```rust
#[event]
pub struct EscrowCreated {
    pub escrow_id: BytesN<32>,
    pub client: Address,
    pub freelancer: Address,
    pub total_amount: i128,
}

#[event]
pub struct FundsDeposited {
    pub escrow_id: BytesN<32>,
    pub amount: i128,
}

#[event]
pub struct MilestoneSubmitted {
    pub escrow_id: BytesN<32>,
    pub milestone_index: u32,
    pub submitted_at: u64,
}

#[event]
pub struct MilestoneApproved {
    pub escrow_id: BytesN<32>,
    pub milestone_index: u32,
    pub amount: i128,
    pub auto_approved: bool,
}

#[event]
pub struct MilestoneRejected {
    pub escrow_id: BytesN<32>,
    pub milestone_index: u32,
}
```

## Security Features

1. **Sequential Milestone Enforcement**: Milestones must be completed in order
2. **Double-Claim Prevention**: Status checks prevent multiple releases
3. **Review Window Protection**: Auto-approval only after deadline
4. **Role-Based Access**: Only client can approve, only freelancer can submit
5. **Immutable Terms**: Cannot modify escrow after funding

## Deployment

### Prerequisites
- Rust toolchain
- Soroban CLI
- Stellar account with testnet XLM

### Build
```bash
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release
```

### Optimize
```bash
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/escrow.wasm
```

### Deploy to Testnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source ADMIN_SECRET_KEY \
  --network testnet
```

### Initialize
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source ADMIN_SECRET_KEY \
  --network testnet \
  -- initialize
```

## Testing

```bash
cargo test
```

## Integration with Backend

The backend's `ContractService` class wraps these contract calls:
- Builds transactions
- Signs with user's wallet
- Submits to Horizon
- Parses events
- Returns transaction hashes

## Gas Costs (Estimated)

| Operation | Stroops | XLM |
|-----------|---------|-----|
| create_escrow | ~100,000 | 0.01 |
| deposit_funds | ~50,000 | 0.005 |
| submit_milestone | ~30,000 | 0.003 |
| approve_milestone | ~80,000 | 0.008 |
| reject_milestone | ~30,000 | 0.003 |

## Future Enhancements

- Multi-signature approval
- Partial milestone payments
- Dispute resolution mechanism
- Reputation system integration
- Cross-asset support (USDC, etc.)
