import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle, 
  ExternalLink, RefreshCw, Package, DollarSign, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useStellarWallet } from '@/contexts/WalletContext';
import { api } from '@/lib/api';
import { formatXLM, getExplorerUrl } from '@/lib/stellar';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

interface Escrow {
  id: string;
  contractId: string;
  escrowIdOnChain: string;
  clientWallet: string;
  freelancerWallet: string;
  totalAmount: number;
  status: string;
  creationTxHash?: string;
  depositTxHash?: string;
  fundedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  createdAt: string;
  milestones?: any[];
}

interface Transaction {
  id: string;
  txHash: string;
  txType: string;
  walletAddress: string;
  amount: number;
  createdAt: string;
}

const EscrowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, signTransaction } = useStellarWallet();
  
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (id) {
      loadEscrow();
      loadTransactions();
    }
  }, [id]);

  const loadEscrow = async () => {
    try {
      setLoading(true);
      const data = await api.getEscrow(id!);
      setEscrow(data);
    } catch (error: any) {
      toast.error('Failed to load escrow', { description: error.message });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await fetch(`http://localhost:3001/escrow/${id}/transactions`).then(r => r.json());
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEscrow(), loadTransactions()]);
    setRefreshing(false);
    toast.success('Escrow refreshed');
  };

  const handleFund = async () => {
    if (!escrow || !address) return;
    
    setActionLoading(true);
    try {
      // Step 1: Get unsigned transaction
      const result = await fetch(`http://localhost:3001/escrow/${id}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerWallet: address })
      }).then(r => r.json());

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate transaction');
      }

      toast.info('Please sign the transaction in your wallet');

      // Step 2: Sign transaction
      const signedXdr = await signTransaction(result.xdr);
      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      // Step 3: Submit to blockchain
      const server = new Server('https://soroban-testnet.stellar.org');
      const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const submitResult = await server.sendTransaction(tx);

      // Step 4: Wait for confirmation
      let txResponse = await server.getTransaction(submitResult.hash);
      let attempts = 0;
      while ((txResponse.status === 'PENDING' || txResponse.status === 'NOT_FOUND') && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(submitResult.hash);
        attempts++;
      }

      if (txResponse.status !== 'SUCCESS') {
        throw new Error(`Transaction failed with status: ${txResponse.status}`);
      }

      // Step 5: Complete funding in backend
      const completeResult = await fetch(`http://localhost:3001/escrow/${id}/fund/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: submitResult.hash })
      }).then(r => r.json());

      toast.success('Escrow funded successfully!', {
        description: `Tx: ${submitResult.hash.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${submitResult.hash}`, '_blank'),
        },
      });

      // Refresh escrow state
      await handleRefresh();
    } catch (error: any) {
      console.error('Fund error:', error);
      toast.error('Failed to fund escrow', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!escrow || !address || !proofUrl.trim()) {
      toast.error('Please provide a proof URL');
      return;
    }

    setActionLoading(true);
    try {
      const result = await fetch(`http://localhost:3001/escrow/${id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellerWallet: address,
          proofUrl 
        })
      }).then(r => r.json());

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark as delivered');
      }

      toast.success('Work marked as delivered!');
      setDeliverDialogOpen(false);
      setProofUrl('');
      await handleRefresh();
    } catch (error: any) {
      console.error('Deliver error:', error);
      toast.error('Failed to mark as delivered', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!escrow || !address) return;

    setActionLoading(true);
    try {
      // Step 1: Get unsigned transaction
      const result = await fetch(`http://localhost:3001/escrow/${id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerWallet: address })
      }).then(r => r.json());

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate transaction');
      }

      toast.info('Please sign the transaction in your wallet');

      // Step 2: Sign transaction
      const signedXdr = await signTransaction(result.xdr);
      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled');
      }

      // Step 3: Submit to blockchain
      const server = new Server('https://soroban-testnet.stellar.org');
      const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const submitResult = await server.sendTransaction(tx);

      // Step 4: Wait for confirmation
      let txResponse = await server.getTransaction(submitResult.hash);
      let attempts = 0;
      while ((txResponse.status === 'PENDING' || txResponse.status === 'NOT_FOUND') && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(submitResult.hash);
        attempts++;
      }

      if (txResponse.status !== 'SUCCESS') {
        throw new Error(`Transaction failed with status: ${txResponse.status}`);
      }

      // Step 5: Complete release in backend
      const completeResult = await fetch(`http://localhost:3001/escrow/${id}/release/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: submitResult.hash })
      }).then(r => r.json());

      toast.success('Funds released successfully!', {
        description: `Tx: ${submitResult.hash.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${submitResult.hash}`, '_blank'),
        },
      });

      // Refresh escrow state
      await handleRefresh();
    } catch (error: any) {
      console.error('Release error:', error);
      toast.error('Failed to release funds', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!escrow || !address || !disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setActionLoading(true);
    try {
      const result = await fetch(`http://localhost:3001/escrow/${id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          buyerWallet: address,
          reason: disputeReason 
        })
      }).then(r => r.json());

      if (!result.success) {
        throw new Error(result.error || 'Failed to raise dispute');
      }

      toast.error('Dispute raised', { description: 'Escrow is now under review' });
      setDisputeDialogOpen(false);
      setDisputeReason('');
      await handleRefresh();
    } catch (error: any) {
      console.error('Dispute error:', error);
      toast.error('Failed to raise dispute', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading escrow...</p>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Escrow Not Found</h2>
            <p className="text-muted-foreground mb-4">The escrow you're looking for doesn't exist.</p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBuyer = address === escrow.clientWallet;
  const isSeller = address === escrow.freelancerWallet;
  const statusColor = {
    CREATED: 'bg-yellow-500',
    FUNDED: 'bg-blue-500',
    DELIVERED: 'bg-purple-500',
    COMPLETED: 'bg-green-500',
    DISPUTED: 'bg-red-500'
  }[escrow.status] || 'bg-gray-500';

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Escrow Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Escrow #{escrow.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    Contract: {escrow.contractId.slice(0, 16)}...
                  </p>
                </div>
                <Badge className={`${statusColor} text-white`}>
                  {escrow.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parties */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Buyer</p>
                  <p className="font-mono text-sm">{escrow.clientWallet.slice(0, 12)}...</p>
                  {isBuyer && <Badge variant="outline" className="text-xs">You</Badge>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="font-mono text-sm">{escrow.freelancerWallet.slice(0, 12)}...</p>
                  {isSeller && <Badge variant="outline" className="text-xs">You</Badge>}
                </div>
              </div>

              <Separator />

              {/* Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <span className="text-2xl font-bold text-gradient">{formatXLM(escrow.totalAmount)}</span>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Progress</p>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-2 rounded-full ${escrow.status !== 'CREATED' ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`flex-1 h-2 rounded-full ${['FUNDED', 'DELIVERED', 'COMPLETED'].includes(escrow.status) ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`flex-1 h-2 rounded-full ${['DELIVERED', 'COMPLETED'].includes(escrow.status) ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`flex-1 h-2 rounded-full ${escrow.status === 'COMPLETED' ? 'bg-primary' : 'bg-muted'}`} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created</span>
                  <span>Funded</span>
                  <span>Delivered</span>
                  <span>Released</span>
                </div>
              </div>

              {/* Dispute Warning */}
              {escrow.status === 'DISPUTED' && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Dispute Raised</p>
                    <p className="text-xs text-muted-foreground mt-1">{escrow.disputeReason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{tx.txType}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tx.txHash.slice(0, 16)}...</p>
                      </div>
                      <a
                        href={getExplorerUrl(tx.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Buyer Actions */}
              {isBuyer && escrow.status === 'CREATED' && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleFund}
                  disabled={actionLoading}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Processing...' : 'Fund Escrow'}
                </Button>
              )}

              {isBuyer && escrow.status === 'DELIVERED' && (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleRelease}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Release Funds'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setDisputeDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Raise Dispute
                  </Button>
                </div>
              )}

              {isBuyer && escrow.status === 'FUNDED' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setDisputeDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Raise Dispute
                </Button>
              )}

              {/* Seller Actions */}
              {isSeller && escrow.status === 'FUNDED' && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setDeliverDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}

              {/* Completed State */}
              {escrow.status === 'COMPLETED' && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Escrow Completed</p>
                  <p className="text-xs text-muted-foreground">Funds have been released</p>
                </div>
              )}

              {/* Waiting States */}
              {!isBuyer && !isSeller && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You are not a party to this escrow
                </p>
              )}

              {isBuyer && escrow.status === 'FUNDED' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Waiting for seller to deliver work...
                </p>
              )}

              {isSeller && escrow.status === 'CREATED' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Waiting for buyer to fund escrow...
                </p>
              )}

              {isSeller && escrow.status === 'DELIVERED' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Waiting for buyer to review and release funds...
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Deliver Dialog */}
        <Dialog open={deliverDialogOpen} onOpenChange={setDeliverDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Work as Delivered</DialogTitle>
              <DialogDescription>
                Provide a link to your completed work for buyer review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Proof URL</Label>
                <Input
                  placeholder="https://github.com/user/repo or https://drive.google.com/..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Link to your completed work for buyer review
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeliverDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeliver} disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Mark as Delivered'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dispute Dialog */}
        <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise Dispute</DialogTitle>
              <DialogDescription>
                Explain the issue with this escrow. This will pause the escrow for review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason for Dispute</Label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDispute} disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Raise Dispute'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EscrowPage;
