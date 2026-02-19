import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MilestoneInput } from '@/types/escrow';
import { isValidStellarAddress } from '@/lib/stellar';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateEscrowProps {
  walletAddress: string | null;
}

const CreateEscrow = ({ walletAddress }: CreateEscrowProps) => {
  const navigate = useNavigate();
  const [freelancerWallet, setFreelancerWallet] = useState('');
  const [reviewWindowDays, setReviewWindowDays] = useState('3');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: '', amount: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addMilestone = () => {
    setMilestones(prev => [...prev, { description: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length === 1) return;
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    setMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isValidStellarAddress(freelancerWallet)) {
      toast.error('Invalid Stellar wallet address');
      return;
    }

    if (freelancerWallet === walletAddress) {
      toast.error('Cannot create escrow with yourself');
      return;
    }

    const reviewDays = parseInt(reviewWindowDays);
    if (!reviewDays || reviewDays < 1) {
      toast.error('Review window must be at least 1 day');
      return;
    }

    if (milestones.some(m => !m.description.trim() || !m.amount || parseFloat(m.amount) <= 0)) {
      toast.error('All milestones must have a description and valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createEscrow({
        clientWallet: walletAddress,
        freelancerWallet,
        milestones,
        reviewWindowDays: reviewDays,
      });

      toast.success('Escrow created successfully!', {
        description: `Tx: ${result.txHash.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(result.explorerUrl, '_blank'),
        },
      });

      // Auto-deposit funds
      try {
        const depositResult = await api.depositFunds(result.escrowId, walletAddress);
        toast.success('Funds deposited!', {
          description: `Tx: ${depositResult.txHash.slice(0, 8)}...`,
        });
      } catch (depositError: any) {
        toast.error('Deposit failed', { description: depositError.message });
      }

      navigate('/dashboard/client');
    } catch (error: any) {
      toast.error('Failed to create escrow', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Freelancer Wallet Address</Label>
                  <Input
                    placeholder="G..."
                    value={freelancerWallet}
                    onChange={e => setFreelancerWallet(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {freelancerWallet && !isValidStellarAddress(freelancerWallet) && (
                    <p className="text-xs text-destructive">Invalid Stellar address format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Review Window (Days)</Label>
                  <Input
                    type="number"
                    value={reviewWindowDays}
                    onChange={e => setReviewWindowDays(e.target.value)}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time allowed for you to review each milestone submission
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Milestones</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="gap-1">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>

                  {milestones.map((milestone, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-mono text-primary mt-1">
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Milestone description"
                          value={milestone.description}
                          onChange={e => updateMilestone(i, 'description', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Amount (XLM)"
                          value={milestone.amount}
                          onChange={e => updateMilestone(i, 'amount', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(i)}
                        disabled={milestones.length === 1}
                        className="mt-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold text-gradient">{totalAmount.toLocaleString()} XLM</span>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Deploying Contract...' : 'Create Escrow & Deposit Funds'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEscrow;
