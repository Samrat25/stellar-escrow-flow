import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { getAvailableWallets, connectWallet, getWalletDownloadLink, type WalletType } from '@/lib/wallets';
import { toast } from 'sonner';

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (address: string, walletType: WalletType) => void;
}

const WalletSelector = ({ open, onOpenChange, onConnect }: WalletSelectorProps) => {
  const [connecting, setConnecting] = useState<WalletType | null>(null);
  const [wallets, setWallets] = useState(getAvailableWallets());

  // Refresh wallet list when dialog opens
  useEffect(() => {
    if (open) {
      setWallets(getAvailableWallets());
    }
  }, [open]);

  const handleConnect = async (walletType: WalletType) => {
    setConnecting(walletType);
    
    try {
      const address = await connectWallet(walletType);
      
      localStorage.setItem('selectedWallet', walletType);
      localStorage.setItem('walletAddress', address);
      
      toast.success(`Connected to ${walletType}!`, {
        description: `${address.slice(0, 8)}...${address.slice(-4)}`,
      });
      
      onConnect(address, walletType);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Connection failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDownload = (walletType: WalletType) => {
    const link = getWalletDownloadLink(walletType);
    window.open(link, '_blank');
  };

  const handleRefresh = () => {
    setWallets(getAvailableWallets());
    toast.info('Refreshed wallet list');
  };

  const freighterWallet = wallets.find(w => w.type === 'freighter');
  const otherWallets = wallets.filter(w => w.type !== 'freighter');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Connect Wallet</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Choose your preferred Stellar wallet to connect
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {freighterWallet && (
            <Card
              className="p-4 cursor-pointer transition-all hover:border-primary border-2 border-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{freighterWallet.icon}</span>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {freighterWallet.name}
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">RECOMMENDED</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Browser extension wallet for Stellar
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleConnect(freighterWallet.type)}
                  disabled={connecting !== null}
                >
                  {connecting === freighterWallet.type ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {!freighterWallet?.installed && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-medium">Don't have Freighter?</p>
                <p>Click "Connect" and you'll be guided to install it if needed.</p>
              </div>
            </div>
          )}

          {otherWallets.map((wallet) => (
            <Card
              key={wallet.type}
              className={`p-4 cursor-pointer transition-all hover:border-primary ${
                !wallet.installed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.installed ? 'Installed' : 'Not installed'}
                    </p>
                  </div>
                </div>
                
                {wallet.installed ? (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(wallet.type)}
                    disabled={connecting !== null}
                  >
                    {connecting === wallet.type ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Connecting...
                      </div>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(wallet.type)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Install
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Make sure you're on <span className="font-medium">Stellar Testnet</span> in your wallet settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;
