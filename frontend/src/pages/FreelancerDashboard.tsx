import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Escrow, Milestone } from '@/types/escrow';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getExplorerUrl, formatXLM } from '@/lib/stellar';
import DeadlineCountdown from '@/components/DeadlineCountdown';

interface FreelancerDashboardProps {
  walletAddress: string;
}

const FreelancerDashboard = ({ walletAddress }: FreelancerDashboardProps) => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEscrows();
  }, [walletAddress]);

  const loadEscrows = async () => {
    try {
      const data = await api.getWalletEscrows(walletAddress);
      setEscrows(data.filter(e => e.freelancer_wallet === walletAddress));
    } catch (error) {
      toast.error('Failed to load escrows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setProofUrl('');
    setSubmitDialogOpen(true);
  };

  const handleSubmitConfirm = async () => {
    if (!selectedMilestone || !proofUrl.trim()) {
      toast.error('Please provide a proof URL');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitMilestone(selectedMilestone.id, walletAddress, proofUrl);
      toast.success('Milestone submitted for review!', {
        description: `Tx: ${result.txHash?.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(result.explorerUrl, '_blank'),
        },
      });
      setSubmitDialogOpen(false);
      setProofUrl('');
      loadEscrows();
    } catch (error: any) {
      toast.error('Submission failed', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const freelancerEscrows = escrows.filter(e => e.freelancer_wallet === walletAddress);
  const activeEscrows = freelancerEscrows.filter(e => e.status === 'ACTIVE' || e.status === 'FUNDED');
  const completedEscrows = freelancerEscrows.filter(e => e.status === 'COMPLETED');
  const totalEarned = freelancerEscrows.reduce((sum, e) => {
    const approvedAmount = e.milestones?.filter(m => m.status === 'APPROVED')
      .reduce((s, m) => s + m.amount, 0) || 0;
    return sum + approvedAmount;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading escrows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your projects and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Activity className="h-3.5 w-3.5" /> Total Projects
              </div>
              <div className="text-2xl font-bold">{freelancerEscrows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Clock className="h-3.5 w-3.5" /> Active
              </div>
              <div className="text-2xl font-bold">{activeEscrows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </div>
              <div className="text-2xl font-bold">{completedEscrows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Activity className="h-3.5 w-3.5" /> Total Earned
              </div>
              <div className="text-2xl font-bold">{formatXLM(totalEarned)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Escrows */}
        {freelancerEscrows.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground">No projects assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {freelancerEscrows.map((escrow) => (
              <Card key={escrow.id} className="border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Project #{escrow.id.slice(0, 8)}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {escrow.contract_id.slice(0, 12)}...
                      </p>
                    </div>
                    <Badge variant={escrow.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {escrow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-mono">{escrow.client_wallet.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-bold">{formatXLM(escrow.total_amount)}</span>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                    {escrow.milestones?.map((milestone: Milestone, index: number) => {
                      const canSubmit = milestone.status === 'PENDING' || milestone.status === 'REJECTED';
                      const isPreviousApproved = index === 0 || 
                        escrow.milestones?.[index - 1]?.status === 'APPROVED';

                      return (
                        <div key={milestone.id} className="border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              #{milestone.milestone_index + 1}: {milestone.description}
                            </span>
                            <Badge variant={
                              milestone.status === 'APPROVED' ? 'default' :
                              milestone.status === 'SUBMITTED' ? 'secondary' :
                              milestone.status === 'REJECTED' ? 'destructive' : 'outline'
                            }>
                              {milestone.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatXLM(milestone.amount)}</span>
                            {milestone.auto_approved && <span className="text-success">Auto-approved</span>}
                          </div>

                          {milestone.status === 'SUBMITTED' && milestone.review_deadline && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Awaiting client review</p>
                              <DeadlineCountdown deadline={milestone.review_deadline} />
                            </div>
                          )}

                          {milestone.status === 'APPROVED' && (
                            <div className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Payment received</span>
                              {milestone.approval_tx_hash && (
                                <a
                                  href={getExplorerUrl(milestone.approval_tx_hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline ml-1"
                                >
                                  View Tx
                                </a>
                              )}
                            </div>
                          )}

                          {milestone.status === 'REJECTED' && (
                            <div className="space-y-1">
                              <p className="text-xs text-destructive">
                                Rejected: {milestone.rejection_reason}
                              </p>
                              {isPreviousApproved && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitClick(milestone)}
                                  className="w-full"
                                >
                                  <Upload className="h-3 w-3 mr-1" /> Resubmit
                                </Button>
                              )}
                            </div>
                          )}

                          {milestone.status === 'PENDING' && isPreviousApproved && (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitClick(milestone)}
                              className="w-full"
                            >
                              <Upload className="h-3 w-3 mr-1" /> Submit Milestone
                            </Button>
                          )}

                          {milestone.status === 'PENDING' && !isPreviousApproved && (
                            <p className="text-xs text-muted-foreground">
                              Complete previous milestone first
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {escrow.creation_tx_hash && (
                    <a
                      href={getExplorerUrl(escrow.creation_tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block"
                    >
                      View on Explorer →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Milestone</DialogTitle>
            <DialogDescription>
              Provide a link to your work (GitHub, Google Drive, IPFS, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMilestone && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Milestone #{selectedMilestone.milestone_index + 1}: {selectedMilestone.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  Amount: {formatXLM(selectedMilestone.amount)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Proof URL</Label>
              <Input
                placeholder="https://github.com/user/repo or https://drive.google.com/..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Link to your completed work for client review
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitConfirm} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreelancerDashboard;
