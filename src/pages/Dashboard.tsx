import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EscrowCard from '@/components/EscrowCard';
import { mockEscrows } from '@/lib/mock-data';
import { Escrow } from '@/types/escrow';
import { toast } from 'sonner';

interface DashboardProps {
  walletAddress: string | null;
}

const Dashboard = ({ walletAddress }: DashboardProps) => {
  const [escrows, setEscrows] = useState<Escrow[]>(mockEscrows);

  const handleApprove = (escrowId: string, milestoneId: string) => {
    setEscrows(prev => prev.map(e =>
      e.id === escrowId
        ? {
            ...e,
            milestones: e.milestones.map(m =>
              m.id === milestoneId
                ? { ...m, status: 'APPROVED' as const, approvedAt: new Date().toISOString() }
                : m
            ),
          }
        : e
    ));
    toast.success('Milestone approved! Funds released to freelancer.', {
      description: 'Transaction hash: 3a8f...c91d',
    });
  };

  const handleReject = (escrowId: string, milestoneId: string) => {
    setEscrows(prev => prev.map(e =>
      e.id === escrowId
        ? {
            ...e,
            milestones: e.milestones.map(m =>
              m.id === milestoneId ? { ...m, status: 'REJECTED' as const } : m
            ),
          }
        : e
    ));
    toast.error('Milestone rejected.');
  };

  const handleSubmit = (escrowId: string, milestoneId: string) => {
    setEscrows(prev => prev.map(e =>
      e.id === escrowId
        ? {
            ...e,
            milestones: e.milestones.map(m =>
              m.id === milestoneId
                ? { ...m, status: 'SUBMITTED' as const, submittedAt: new Date().toISOString() }
                : m
            ),
          }
        : e
    ));
    toast.success('Milestone submitted for review!');
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-12 text-center max-w-md"
        >
          <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Stellar wallet to view and manage your escrows.
          </p>
          <p className="text-xs text-muted-foreground">Supports Freighter Wallet on Stellar Testnet</p>
        </motion.div>
      </div>
    );
  }

  const clientEscrows = escrows.filter(e => e.clientWallet === walletAddress);
  const freelancerEscrows = escrows.filter(e => e.freelancerWallet === walletAddress);

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your escrows and milestones</p>
          </div>
          <Link to="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Escrow
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Escrows', value: escrows.length, icon: Activity },
            { label: 'As Client', value: clientEscrows.length, icon: Wallet },
            { label: 'As Freelancer', value: freelancerEscrows.length, icon: Wallet },
            { label: 'Total Value', value: `${escrows.reduce((s, e) => s + e.totalAmount, 0).toLocaleString()} XLM`, icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({escrows.length})</TabsTrigger>
            <TabsTrigger value="client">As Client ({clientEscrows.length})</TabsTrigger>
            <TabsTrigger value="freelancer">As Freelancer ({freelancerEscrows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 gap-6">
              {escrows.map(e => (
                <EscrowCard key={e.id} escrow={e} onApprove={handleApprove} onReject={handleReject} onSubmit={handleSubmit} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="client">
            <div className="grid md:grid-cols-2 gap-6">
              {clientEscrows.map(e => (
                <EscrowCard key={e.id} escrow={e} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="freelancer">
            <div className="grid md:grid-cols-2 gap-6">
              {freelancerEscrows.map(e => (
                <EscrowCard key={e.id} escrow={e} onSubmit={handleSubmit} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
