import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStellarWallet } from '@/contexts/WalletContext';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SorobanRpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

const CreateMilestone = () => {
  const { address, kit } = useStellarWallet();
  const { mode } = useMode();
  const navigate = useNavigate();
  
  const [freelancerWallet, setFreelancerWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (mode !== 'BUYING') {
      toast.error('Switch to BUYING mode to create milestones');
      return;
    }

    if (!freelancerWallet || !amount) {
      toast.error('Please fill all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create milestone (get XDR for signing)
      const createResult = await api.createMilestone({
        clientWallet: address,
        freelancerWallet,
        amount: amountNum,
        mode
      });

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create milestone');
      }

      // If needs signing, sign the transaction
      if (createResult.needsSigning && createResult.xdr) {
        toast.info('Please sign the transaction in your wallet');
        
        const signedXdr = await kit?.signTransaction(createResult.xdr);
        
        if (!signedXdr) {
          throw new Error('Transaction signing cancelled');
        }

        // Step 2: Submit signed transaction to Stellar network
        toast.info('Submitting transaction to blockchain...');
        
        const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
        const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        const submitResult = await server.sendTransaction(tx);
        
        // Step 3: Wait for transaction confirmation
        let txResponse = await server.getTransaction(submitResult.hash);
        let attempts = 0;
        
        while (txResponse.status === 'PENDING' || txResponse.status === 'NOT_FOUND') {
          if (attempts >= 30) {
            throw new Error('Transaction confirmation timeout');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          txResponse = await server.getTransaction(submitResult.hash);
          attempts++;
        }
        
        if (txResponse.status !== 'SUCCESS') {
          throw new Error(`Transaction failed: ${txResponse.status}`);
        }

        // Step 4: Complete milestone creation in database
        toast.info('Saving to database...');
        
        await api.completeMilestoneCreation({
          txHash: submitResult.hash,
          contractId: createResult.contractId,
          escrowId: createResult.escrowId,
          clientWallet: address,
          freelancerWallet,
          amount: amountNum,
          mode
        });

        toast.success('Milestone created successfully!', {
          description: 'Now you can fund it to lock XLM in the contract'
        });
        
        navigate('/dashboard');
      } else {
        toast.success('Milestone created!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Create milestone error:', error);
      toast.error(error.message || 'Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    navigate('/');
    return null;
  }

  if (mode !== 'BUYING') {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">
                Switch to BUYING mode to create milestones
              </p>
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create New Milestone</CardTitle>
            <CardDescription>
              Create a milestone and lock XLM in the smart contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="freelancer">Freelancer Wallet Address</Label>
                <Input
                  id="freelancer"
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={freelancerWallet}
                  onChange={(e) => setFreelancerWallet(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The Stellar wallet address of the freelancer
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (XLM)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Amount to lock in the smart contract
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">What happens next?</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Milestone is created on the blockchain</li>
                  <li>You fund the milestone (XLM locked in contract)</li>
                  <li>Freelancer submits work</li>
                  <li>You approve and release funds to freelancer</li>
                </ol>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Milestone'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateMilestone;
