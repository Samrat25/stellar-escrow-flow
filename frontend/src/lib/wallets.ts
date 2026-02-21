import { 
  isConnected, 
  requestAccess, 
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export type WalletType = 'freighter' | 'albedo' | 'xbull';

export interface WalletInfo {
  name: string;
  type: WalletType;
  icon: string;
  installed: boolean;
}

export const checkWalletInstallationSync = (): Record<WalletType, boolean> => {
  if (typeof window === 'undefined') {
    return { freighter: false, albedo: false, xbull: false };
  }

  // For Freighter, we'll assume it might be installed
  // The actual check happens async when connecting
  const hasAlbedo = true;
  const hasXBull = !!(window as any).xBullSDK || !!(window as any).xbull;

  return {
    freighter: true, // Always show Freighter option, check on connect
    albedo: hasAlbedo,
    xbull: hasXBull,
  };
};

export const getAvailableWallets = (): WalletInfo[] => {
  const installed = checkWalletInstallationSync();
  
  return [
    {
      name: 'Freighter',
      type: 'freighter',
      icon: '🚀',
      installed: installed.freighter,
    },
    {
      name: 'Albedo',
      type: 'albedo',
      icon: '⭐',
      installed: installed.albedo,
    },
    {
      name: 'xBull',
      type: 'xbull',
      icon: '🐂',
      installed: installed.xbull,
    },
  ];
};

const connectFreighter = async (): Promise<string> => {
  try {
    console.log('Attempting to connect to Freighter...');
    
    // Check if Freighter is installed and connected
    const connectionCheck = await isConnected();
    console.log('Freighter connection check:', connectionCheck);
    
    if (connectionCheck.error) {
      throw new Error(connectionCheck.error);
    }
    
    if (!connectionCheck.isConnected) {
      throw new Error('Freighter is not installed. Please install the Freighter browser extension from https://www.freighter.app/ and refresh this page.');
    }

    // Request access and get public key
    console.log('Requesting access to Freighter...');
    const accessResult = await requestAccess();
    console.log('Freighter access result:', accessResult);
    
    if (accessResult.error) {
      throw new Error(accessResult.error);
    }

    if (!accessResult.address || typeof accessResult.address !== 'string') {
      throw new Error('Failed to get wallet address from Freighter');
    }

    console.log('Successfully connected to Freighter:', accessResult.address);
    return accessResult.address;
  } catch (error: any) {
    console.error('Freighter connection error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('User declined access')) {
      throw new Error('You declined access to Freighter. Please try again and approve the connection.');
    }
    
    throw new Error(error.message || 'Failed to connect to Freighter wallet. Make sure the extension is installed and enabled.');
  }
};

const connectAlbedo = async (): Promise<string> => {
  if (!('albedo' in window)) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@0.11.2/lib/albedo.intent.js';
    script.async = true;
    document.head.appendChild(script);
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Albedo'));
    });
  }

  const albedo = (window as any).albedo;
  const result = await albedo.publicKey({ require_existing: false });
  
  if (!result || !result.pubkey) {
    throw new Error('Failed to get public key from Albedo');
  }

  return result.pubkey;
};

const connectXBull = async (): Promise<string> => {
  if (!('xBullSDK' in window)) {
    throw new Error('xBull wallet not installed');
  }

  const xBullSDK = (window as any).xBullSDK;
  
  const xbull = new xBullSDK.StellarWalletsKit({
    network: 'testnet',
    selectedWallet: 'xbull',
  });

  await xbull.openModal({
    onWalletSelected: async (option: any) => {
      xbull.setWallet(option.id);
    },
  });

  const publicKey = await xbull.getPublicKey();
  
  if (!publicKey) {
    throw new Error('Failed to get public key from xBull');
  }

  return publicKey;
};

export const connectWallet = async (walletType: WalletType): Promise<string> => {
  switch (walletType) {
    case 'freighter':
      return await connectFreighter();
    case 'albedo':
      return await connectAlbedo();
    case 'xbull':
      return await connectXBull();
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
};

export const signTransaction = async (
  walletType: WalletType,
  xdr: string,
  network: string = 'testnet'
): Promise<string> => {
  switch (walletType) {
    case 'freighter': {
      try {
        const result = await freighterSignTransaction(xdr, {
          network: network === 'testnet' ? 'TESTNET' : 'PUBLIC',
          networkPassphrase: network === 'testnet' 
            ? 'Test SDF Network ; September 2015'
            : 'Public Global Stellar Network ; September 2015',
        });
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        return result.signedTxXdr;
      } catch (error: any) {
        console.error('Freighter signing error:', error);
        throw new Error(error.message || 'Failed to sign transaction');
      }
    }
    
    case 'albedo': {
      const albedo = (window as any).albedo;
      const result = await albedo.tx({
        xdr,
        network: network === 'testnet' ? 'testnet' : 'public',
      });
      return result.signed_envelope_xdr;
    }
    
    case 'xbull': {
      const xBullSDK = (window as any).xBullSDK;
      const xbull = new xBullSDK.StellarWalletsKit({
        network: network === 'testnet' ? 'testnet' : 'public',
        selectedWallet: 'xbull',
      });
      const result = await xbull.sign({
        xdr,
        publicKey: await xbull.getPublicKey(),
      });
      return result;
    }
    
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
};

export const disconnectWallet = (walletType: WalletType): void => {
  localStorage.removeItem('selectedWallet');
  localStorage.removeItem('walletAddress');
};

export const getWalletDownloadLink = (walletType: WalletType): string => {
  const links = {
    freighter: 'https://www.freighter.app/',
    albedo: 'https://albedo.link/',
    xbull: 'https://xbull.app/',
  };
  
  return links[walletType];
};
