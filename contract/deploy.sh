#!/bin/bash
set -e

NETWORK="${1:-testnet}"
SOURCE_ACCOUNT="${2}"

if [ -z "$SOURCE_ACCOUNT" ]; then
  echo "Usage: ./deploy.sh [network] [source_account]"
  echo "Example: ./deploy.sh testnet GXXXXXX..."
  exit 1
fi

echo "Deploying to $NETWORK..."

CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm \
  --source $SOURCE_ACCOUNT \
  --network $NETWORK)

echo "Contract deployed!"
echo "CONTRACT_ID=$CONTRACT_ID"
echo ""
echo "Add this to your backend/.env:"
echo "CONTRACT_ID=$CONTRACT_ID"
