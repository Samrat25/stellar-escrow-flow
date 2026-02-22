import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateMilestone from "./pages/CreateMilestone";
import MilestoneDetail from "./pages/MilestoneDetail";
import Profile from "./pages/Profile";
import FeedbackClient from "./pages/FeedbackClient";
import FeedbackFreelancer from "./pages/FeedbackFreelancer";
import NotFound from "./pages/NotFound";
import { useStellarWallet } from './contexts/WalletContext';

const queryClient = new QueryClient();

const App = () => {
  const { address } = useStellarWallet();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              address ? <Dashboard /> : <Navigate to="/" replace />
            } />
            <Route path="/create-milestone" element={
              address ? <CreateMilestone /> : <Navigate to="/" replace />
            } />
            <Route path="/milestone/:id" element={
              address ? <MilestoneDetail /> : <Navigate to="/" replace />
            } />
            <Route path="/profile/:wallet" element={<Profile />} />
            <Route path="/feedback/client" element={<FeedbackClient />} />
            <Route path="/feedback/freelancer" element={<FeedbackFreelancer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
