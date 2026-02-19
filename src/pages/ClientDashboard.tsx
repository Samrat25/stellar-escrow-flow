import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Escrow, Milestone } from '@/types/escrow';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getExplorerUrl, formatXLM } from '@/lib/stellar';
import DeadlineCountdown from '@/components/DeadlineCountdown';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface ClientDashboardProps {
  walletAddress: string;
}

const ClientDashboard = ({ walletAddress }: ClientDashboardProps) => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<{ escrowId: string; milestoneId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadEscrows();
  }, [walletAddress]);

  const loadEscrows = async () => {
    try {
      const data = await api.getWalletEscrows(walletAddress);
      setEscrows(data.filter(e => e.client_wallet === walletAddress));
    } catch (error) {
      toast.error('Failed to load escrows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (milestoneId: string) => {
    try {
      const result = await api.approveMilestone(milestoneId, walletAddress);
      toast.success('Milestone approved! Funds released.', {
        description: `Tx: ${result.txHash?.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(result.explorerUrl, '_blank'),
        },
      });
      loadEscrows();
    } catch (error: any) {
      toast.error('Approval failed', { description: error.message });
    }
  };

  const handleRejectClick = (milestoneId: string) => {
    setSelectedMilestone({ escrowId: '', milestoneId });
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedMilestone || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const result = await api.rejectMilestone(selectedMilestone.milestoneId, walletAddress, rejectionReason);
      toast.error('Milestone rejected', {
        description: `Tx: ${result.txHash?.slice(0, 8)}...`,
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      loadEscrows();
    } catch (error: any) {
      toast.error('Rejection failed', { description: error.message });
    }
  };

  const clientEscrows = escrows.filter(e => e.client_wallet === walletAddress);
  const activeEscrows = clientEscrows.filter(e => e.status === 'ACTIVE' || e.status === 'FUNDED');
  const completedEscrows = clientEscrows.filter(e => e.status === 'COMPLETED');
  const totalValue = clientEscrows.reduce((sum, e) => sum + e.total_amount, 0);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Client Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your escrow agreements</p>
          </div>
          <Link to="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Escrow
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Activity className="h-3.5 w-3.5" /> Total Escrows
              </div>
              <div className="text-2xl font-bold">{clientEscrows.length}</div>
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
                <Activity className="h-3.5 w-3.5" /> Total Value
              </div>
              <div className="text-2xl font-bold">{formatXLM(totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Escrows */}
        {clientEscrows.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">No escrows yet</p>
              <Link to="/create">
                <Button>Create Your First Escrow</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {clientEscrows.map((escrow) => (
              <Card key={escrow.id} className="border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Escrow #{escrow.id.slice(0, 8)}</CardTitle>
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
                    <span className="text-muted-foreground">Freelancer</span>
                    <span className="font-mono">{escrow.freelancer_wallet.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-bold">{formatXLM(escrow.total_amount)}</span>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                    {escrow.milestones?.map((milestone: Milestone) => (
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
                          {milestone.auto_approved && <span className="text-warning">Auto-approved</span>}
                        </div>

                        {milestone.status === 'SUBMITTED' && milestone.review_deadline && (
                          <div className="space-y-2">
                            <DeadlineCountdown deadline={milestone.review_deadline} />
                            {milestone.proof_url && (
                              <a
                                href={milestone.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                View Proof →
                              </a>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(milestone.id)}
                                className="flex-1"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClick(milestone.id)}
                                className="flex-1"
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {milestone.status === 'REJECTED' && milestone.rejection_reason && (
                          <p className="text-xs text-destructive">Reason: {milestone.rejection_reason}</p>
                        )}
                      </div>
                    ))}
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

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this milestone. The freelancer will be able to resubmit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectConfirm}>Reject Milestone</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDashboard;
