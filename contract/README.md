# Stellar Escrow Contract

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm
```

## Deploy

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm \
  --source YOUR_STELLAR_ADDRESS \
  --network testnet
```

## Test

```bash
cargo test
```
