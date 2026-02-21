import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, User, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { truncateAddress, getWalletBalance, formatXLM } from '@/lib/stellar';
import { useStellarWallet } from '@/contexts/WalletContext';
import { useMode } from '@/contexts/ModeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Create Milestone', path: '/create-milestone' },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const { address, connect, disconnect } = useStellarWallet();
  const { mode, toggleMode } = useMode();

  useEffect(() => {
    if (address) {
      loadBalance();
      const interval = setInterval(loadBalance, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [address]);

  const loadBalance = async () => {
    if (!address) return;
    const bal = await getWalletBalance(address);
    setBalance(bal);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-gradient">TrustPay</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                size="sm"
                className="text-sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {address ? (
            <>
              {balance !== null && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{formatXLM(balance)}</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMode}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode === 'BUYING' ? 'Switch to Selling' : 'Switch to Buying'}</span>
                <Badge variant={mode === 'BUYING' ? 'default' : 'secondary'} className="text-[10px]">
                  {mode}
                </Badge>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-mono text-xs hidden sm:inline">{truncateAddress(address)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono">{truncateAddress(address)}</span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Mode: {mode}
                      </span>
                      {balance !== null && (
                        <span className="text-xs font-medium text-primary mt-1">
                          Balance: {formatXLM(balance)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnect}>
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={connect} size="sm">
              Connect Wallet
            </Button>
          )}

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-b border-border px-4 pb-4">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm my-1">
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
