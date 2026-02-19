# Contract Deployment Instructions

## Prerequisites

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

2. Install Soroban CLI:
```bash
cargo install --locked soroban-cli
```

3. Configure Stellar testnet:
```bash
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

4. Create and fund identity:
```bash
soroban keys generate alice --network testnet
soroban keys address alice

# Fund from friendbot
curl "https://friendbot.stellar.org?addr=$(soroban keys address alice)"
```

## Build Contract

```bash
cd contract

# Build
cargo build --target wasm32-unknown-unknown --release

# Optimize
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm
```

## Deploy Contract

```bash
# Deploy
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm \
  --source alice \
  --network testnet)

echo "CONTRACT_ID=$CONTRACT_ID"
```

## Update Backend Configuration

Copy the CONTRACT_ID and update `backend/.env`:

```env
CONTRACT_ID=YOUR_CONTRACT_ID_HERE
USE_REAL_CONTRACT=true
```

## Test Contract

```bash
# Test locally
cargo test

# Invoke on testnet
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  get_escrow
```

## Contract Address

After deployment, your contract will be accessible at:
- Testnet Explorer: https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID
- Horizon: https://horizon-testnet.stellar.org

## Important Notes

- Contract is immutable after deployment
- Test thoroughly before mainnet deployment
- Keep CONTRACT_ID secure
- Monitor contract events
- Set up proper error handling
