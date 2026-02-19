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

  const hasFreighter = !!(window as any).freighter;
  const hasAlbedo = true;
  const hasXBull = !!(window as any).xBullSDK || !!(window as any).xbull;

  return {
    freighter: hasFreighter,
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
  if (!(window as any).freighter) {
    throw new Error('Freighter not installed. Install from https://www.freighter.app/ then refresh page.');
  }

  const publicKey = await (window as any).freighter.getPublicKey();
  
  if (!publicKey) {
    throw new Error('Connection cancelled or failed');
  }

  return publicKey;
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
      const freighter = (window as any).freighter;
      const result = await freighter.signTransaction(xdr, {
        network: network === 'testnet' ? 'TESTNET' : 'PUBLIC',
        networkPassphrase: network === 'testnet' 
          ? 'Test SDF Network ; September 2015'
          : 'Public Global Stellar Network ; September 2015',
      });
      return result;
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
