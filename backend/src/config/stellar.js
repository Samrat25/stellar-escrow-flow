import * as StellarSDK from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
export const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = StellarSDK.Networks.TESTNET;

export const server = new StellarSDK.Horizon.Server(HORIZON_URL);

export function getExplorerUrl(txHash) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export function getAccountExplorerUrl(address) {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}

export function isValidStellarAddress(address) {
  try {
    StellarSDK.StrKey.decodeEd25519PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
