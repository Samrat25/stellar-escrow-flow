import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/stellar';

interface NavbarProps {
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}

const navItems = [
  { label: 'Client', path: '/dashboard/client' },
  { label: 'Freelancer', path: '/dashboard/freelancer' },
  { label: 'Create Escrow', path: '/create' },
  { label: 'Feedback', path: '/feedback' },
];

const Navbar = ({ walletAddress, onConnect, onDisconnect, connecting }: NavbarProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {walletAddress ? (
            <div className="flex items-center gap-2">
              <div className="glow-border rounded-lg px-3 py-1.5 font-mono text-sm text-primary">
                {truncateAddress(walletAddress)}
              </div>
              <Button onClick={onDisconnect} variant="ghost" size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={onConnect} disabled={connecting} size="sm">
              {connecting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.div>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          )}

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-b border-border px-4 pb-4"
        >
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm my-1">
                {item.label}
              </Button>
            </Link>
          ))}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
