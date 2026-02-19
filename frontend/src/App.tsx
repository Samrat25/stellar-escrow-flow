import { useState, useCallback, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import Index from "./pages/Index";
import ClientDashboard from "./pages/ClientDashboard";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import CreateEscrow from "./pages/CreateEscrow";
import NotFound from "./pages/NotFound";
import WalletSelector from "./components/WalletSelector";
import { type WalletType } from './lib/wallets';

const queryClient = new QueryClient();

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);

  useEffect(() => {
    const savedWallet = localStorage.getItem('selectedWallet') as WalletType | null;
    const savedAddress = localStorage.getItem('walletAddress');
    
    if (savedWallet && savedAddress) {
      setWalletType(savedWallet);
      setWalletAddress(savedAddress);
    }
  }, []);

  const handleConnect = useCallback(() => {
    setWalletSelectorOpen(true);
  }, []);

  const handleWalletConnect = useCallback((address: string, type: WalletType) => {
    setWalletAddress(address);
    setWalletType(type);
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setWalletType(null);
    localStorage.removeItem('selectedWallet');
    localStorage.removeItem('walletAddress');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar 
            walletAddress={walletAddress} 
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connecting={false}
          />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              walletAddress ? <Navigate to="/dashboard/client" replace /> : <Navigate to="/" replace />
            } />
            <Route path="/dashboard/client" element={
              walletAddress ? <ClientDashboard walletAddress={walletAddress} /> : <Navigate to="/" replace />
            } />
            <Route path="/dashboard/freelancer" element={
              walletAddress ? <FreelancerDashboard walletAddress={walletAddress} /> : <Navigate to="/" replace />
            } />
            <Route path="/create" element={
              walletAddress ? <CreateEscrow walletAddress={walletAddress} /> : <Navigate to="/" replace />
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <WalletSelector
            open={walletSelectorOpen}
            onOpenChange={setWalletSelectorOpen}
            onConnect={handleWalletConnect}
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
