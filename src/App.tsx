import { useState, useCallback } from 'react';
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
import FeedbackPage from "./pages/FeedbackPage";
import NotFound from "./pages/NotFound";
import { connectWallet } from './lib/stellar';
import { toast } from 'sonner';

const queryClient = new QueryClient();

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        toast.success('Wallet connected!', { description: `${address.slice(0, 8)}...${address.slice(-4)}` });
      }
    } catch {
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar walletAddress={walletAddress} onConnect={handleConnect} connecting={connecting} />
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
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
