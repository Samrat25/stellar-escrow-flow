#!/bin/bash
set -e

echo "Building Soroban contract..."
cargo build --target wasm32-unknown-unknown --release

echo "Optimizing WASM..."
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm

echo "Build complete!"
