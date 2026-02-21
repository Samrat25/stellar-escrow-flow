// Stellar/Soroban utilities
// In production, this would use @stellar/stellar-sdk and @stellar/freighter-api

const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
const TESTNET_EXPLORER = 'https://stellar.expert/explorer/testnet';

export const truncateAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getExplorerUrl = (txHash: string): string => {
  return `${TESTNET_EXPLORER}/tx/${txHash}`;
};

export const getAccountExplorerUrl = (address: string): string => {
  return `${TESTNET_EXPLORER}/account/${address}`;
};

export const isValidStellarAddress = (address: string): boolean => {
  return /^G[A-Z2-7]{55}$/.test(address);
};

// Mock wallet connection - replace with Freighter SDK
export const connectWallet = async (): Promise<string | null> => {
  // In production: import { requestAccess } from '@stellar/freighter-api';
  // Simulate wallet connection with a testnet address
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAddresses = [
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9',
        'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DSTL',
        'GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPV',
      ];
      resolve(mockAddresses[Math.floor(Math.random() * mockAddresses.length)]);
    }, 1500);
  });
};

export const formatXLM = (amount: number): string => {
  return `${amount.toLocaleString()} XLM`;
};

export const getWalletBalance = async (address: string): Promise<number> => {
  try {
    const response = await fetch(`${TESTNET_HORIZON}/accounts/${address}`);
    if (!response.ok) return 0;
    
    const account = await response.json();
    const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

export const getDeadlineRemaining = (deadline: string): { days: number; hours: number; minutes: number; expired: boolean } => {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    expired: false,
  };
};
