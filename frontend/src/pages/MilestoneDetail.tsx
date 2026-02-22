import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStellarWallet } from '@/contexts/WalletContext';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatXLM } from '@/lib/stellar';
import { ArrowLeft, Loader2, ExternalLink, CheckCircle2, Clock, AlertCircle, Upload, FileText } from 'lucide-react';
import { Server } from '@stellar/stellar-sdk/rpc';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';

const MilestoneDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { address, kit } = useStellarWallet();
  const { mode } = useMode();
  const navigate = useNavigate();
  
  const [milestone, setMilestone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
    loadMilestone();
  }, [id, address]);

  const loadMilestone = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await api.getMilestone(id);
      setMilestone(data);
    } catch (error) {
      toast.error('Failed to load milestone');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (!address || !milestone) return;
    
    setActionLoading(true);
    try {
      const result = await api.fundMilestone(milestone.id, address, mode);
      
      if (result.needsSigning && result.xdr) {
        toast.info('Please sign the transaction in your wallet');
        
        const signedResult = await kit?.signTransaction(result.xdr);
        
        if (!signedResult) {
          throw new Error('Transaction signing cancelled');
        }

        // Submit signed transaction to Stellar network
        toast.info('Submitting transaction to blockchain...');
        
        const server = new Server('https://soroban-testnet.stellar.org');
        const signedXdr = signedResult.signedTxXdr;
        const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        
        const submitResult = await server.sendTransaction(tx);
        
        // Wait for transaction confirmation
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

        // Complete funding in database
        toast.info('Updating database...');
        
        // Call a completion endpoint (we need to add this)
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/milestone/complete-funding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId: milestone.id,
            txHash: submitResult.hash,
            clientWallet: address,
            mode
          })
        });

        toast.success(`${formatXLM(milestone.amount)} locked in contract!`, {
          description: 'XLM has been transferred to the smart contract'
        });
        loadMilestone();
      } else {
        toast.success('Milestone funded!');
        loadMilestone();
      }
    } catch (error: any) {
      console.error('Fund error:', error);
      toast.error(error.message || 'Failed to fund milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!address || !milestone || !submissionText.trim()) {
      toast.error('Please provide submission details');
      return;
    }
    
    setActionLoading(true);
    try {
      // Build submission data
      let submissionData = submissionText;
      
      // If files are uploaded, add file info
      if (submissionFiles.length > 0) {
        const fileInfo = submissionFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join(', ');
        submissionData += `\n\nFiles: ${fileInfo}`;
        submissionData += '\n\nNote: Files should be uploaded to your preferred storage (Google Drive, Dropbox, etc.) and links included above.';
      }
      
      const result = await api.submitMilestone(milestone.id, address, submissionData, mode);
      
      if (result.needsSigning && result.xdr) {
        toast.info('Please sign the transaction in your wallet');
        
        const signedResult = await kit?.signTransaction(result.xdr);
        
        if (!signedResult) {
          throw new Error('Transaction signing cancelled');
        }

        // Submit to blockchain
        toast.info('Submitting to blockchain...');
        
        const server = new Server('https://soroban-testnet.stellar.org');
        const signedXdr = signedResult.signedTxXdr;
        const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        
        const submitResult = await server.sendTransaction(tx);
        
        // Wait for confirmation
        let txResponse = await server.getTransaction(submitResult.hash);
        let attempts = 0;
        
        while (txResponse.status === 'PENDING' || txResponse.status === 'NOT_FOUND') {
          if (attempts >= 30) throw new Error('Transaction timeout');
          await new Promise(resolve => setTimeout(resolve, 1000));
          txResponse = await server.getTransaction(submitResult.hash);
          attempts++;
        }
        
        if (txResponse.status !== 'SUCCESS') {
          throw new Error(`Transaction failed: ${txResponse.status}`);
        }

        // Complete submission
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/milestone/complete-submission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId: milestone.id,
            txHash: submitResult.hash,
            freelancerWallet: address,
            submissionHash: submissionData,
            mode
          })
        });

        toast.success('Work submitted!');
        setSubmissionText('');
        setSubmissionFiles([]);
        loadMilestone();
      } else {
        toast.success('Work submitted!');
        setSubmissionText('');
        setSubmissionFiles([]);
        loadMilestone();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!address || !milestone) return;
    
    setActionLoading(true);
    try {
      const result = await api.approveMilestone(milestone.id, address, mode);
      
      if (result.needsSigning && result.xdr) {
        toast.info('Please sign the transaction in your wallet');
        
        const signedResult = await kit?.signTransaction(result.xdr);
        
        if (!signedResult) {
          throw new Error('Transaction signing cancelled');
        }

        // Submit to blockchain
        toast.info('Releasing funds to freelancer...');
        
        const server = new Server('https://soroban-testnet.stellar.org');
        const signedXdr = signedResult.signedTxXdr;
        const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        
        const submitResult = await server.sendTransaction(tx);
        
        // Wait for confirmation
        let txResponse = await server.getTransaction(submitResult.hash);
        let attempts = 0;
        
        while (txResponse.status === 'PENDING' || txResponse.status === 'NOT_FOUND') {
          if (attempts >= 30) throw new Error('Transaction timeout');
          await new Promise(resolve => setTimeout(resolve, 1000));
          txResponse = await server.getTransaction(submitResult.hash);
          attempts++;
        }
        
        if (txResponse.status !== 'SUCCESS') {
          throw new Error(`Transaction failed: ${txResponse.status}`);
        }

        // Complete approval
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/milestone/complete-approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId: milestone.id,
            txHash: submitResult.hash,
            clientWallet: address,
            mode
          })
        });

        toast.success(`${formatXLM(milestone.amount)} released to freelancer!`);
        loadMilestone();
      } else {
        toast.success('Milestone approved!');
        loadMilestone();
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.message || 'Failed to approve milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!address || !milestone) return;
    
    setActionLoading(true);
    try {
      await api.disputeMilestone(milestone.id, address);
      toast.success('Dispute raised');
      loadMilestone();
    } catch (error: any) {
      toast.error(error.message || 'Failed to raise dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!address || !milestone || !feedbackComment.trim()) {
      toast.error('Please provide a review comment');
      return;
    }

    setActionLoading(true);
    try {
      const roleType = isClient ? 'CLIENT_REVIEW' : 'FREELANCER_REVIEW';
      const reviewedWallet = isClient ? milestone.escrow.freelancerWallet : milestone.escrow.clientWallet;

      await api.submitFeedback({
        milestoneId: milestone.id,
        reviewerWallet: address,
        reviewedWallet,
        rating: feedbackRating,
        comment: feedbackComment,
        roleType
      });

      toast.success('Review submitted successfully!');
      setFeedbackSubmitted(true);
      setFeedbackComment('');
      setFeedbackRating(5);
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading milestone...</p>
        </div>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">Milestone not found</p>
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isClient = milestone.escrow?.clientWallet === address;
  const isFreelancer = milestone.escrow?.freelancerWallet === address;

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Milestone #{milestone.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                </div>
                <Badge variant={
                  milestone.status === 'APPROVED' ? 'default' : 
                  milestone.status === 'FUNDED' || milestone.status === 'SUBMITTED' ? 'secondary' : 
                  milestone.status === 'DISPUTED' ? 'destructive' :
                  'outline'
                }>
                  {milestone.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="font-mono text-sm">{milestone.escrow?.clientWallet.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Freelancer</p>
                  <p className="font-mono text-sm">{milestone.escrow?.freelancerWallet.slice(0, 12)}...</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-2xl font-bold text-primary">{formatXLM(milestone.amount)}</span>
                </div>
                
                {milestone.status === 'FUNDED' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Locked in smart contract</span>
                  </div>
                )}
                
                {milestone.status === 'APPROVED' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Paid to freelancer</span>
                  </div>
                )}
              </div>

              {milestone.creationTxHash && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Creation Transaction</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${milestone.creationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <span className="font-mono">{milestone.creationTxHash.slice(0, 16)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {milestone.fundingTxHash && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Funding Transaction</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${milestone.fundingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <span className="font-mono">{milestone.fundingTxHash.slice(0, 16)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {milestone.approvalTxHash && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Approval Transaction</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${milestone.approvalTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <span className="font-mono">{milestone.approvalTxHash.slice(0, 16)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Actions */}
          {isClient && milestone.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Lock {formatXLM(milestone.amount)} in the smart contract
                </p>
                <Button onClick={handleFund} disabled={actionLoading} className="w-full">
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Fund ${formatXLM(milestone.amount)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {isClient && milestone.status === 'SUBMITTED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestone.proofUrl && (
                  <div>
                    <Label>Submission Details</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded">{milestone.proofUrl}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={actionLoading} className="flex-1">
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Approve & Release ${formatXLM(milestone.amount)}`
                    )}
                  </Button>
                  <Button onClick={handleDispute} disabled={actionLoading} variant="outline">
                    Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Freelancer Actions */}
          {isFreelancer && milestone.status === 'FUNDED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submission">Work Description & Links</Label>
                  <Textarea
                    id="submission"
                    placeholder="Describe your completed work and provide links to deliverables (Google Drive, Dropbox, GitHub, etc.)"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    disabled={actionLoading}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include links to your work files hosted on cloud storage
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="files">Attach Files (Optional)</Label>
                  <div className="mt-2">
                    <label htmlFor="files" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {submissionFiles.length > 0 
                            ? `${submissionFiles.length} file(s) selected` 
                            : 'Click to upload files (images, videos, zip)'}
                        </span>
                      </div>
                      <input
                        id="files"
                        type="file"
                        multiple
                        accept="image/*,video/*,.zip,.rar,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setSubmissionFiles(Array.from(e.target.files));
                          }
                        }}
                        disabled={actionLoading}
                      />
                    </label>
                  </div>
                  {submissionFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {submissionFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Files are for reference only. Upload your work to cloud storage and include links above.
                  </p>
                </div>
                
                <Button onClick={handleSubmit} disabled={actionLoading || !submissionText.trim()} className="w-full">
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Work'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {isFreelancer && milestone.status === 'SUBMITTED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Awaiting Client Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your work has been submitted. The client will review and approve to release {formatXLM(milestone.amount)} to your wallet.
                </p>
              </CardContent>
            </Card>
          )}

          {isFreelancer && milestone.status === 'APPROVED' && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Payment Received!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The client has approved your work and {formatXLM(milestone.amount)} has been transferred to your wallet. Check your balance!
                </p>
                {milestone.approvalTxHash && (
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${milestone.approvalTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View payment transaction
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {milestone.status === 'DISPUTED' && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Milestone Disputed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This milestone is under dispute. Please contact support for resolution.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section - Only show after milestone is approved */}
          {milestone.status === 'APPROVED' && !feedbackSubmitted && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  How was your experience working with {isClient ? 'the freelancer' : 'the client'}?
                </p>
                
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 cursor-pointer transition-colors ${
                            star <= feedbackRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {feedbackRating} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback">Your Review</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Share your experience working on this milestone..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    disabled={actionLoading}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSubmitFeedback} 
                  disabled={actionLoading || !feedbackComment.trim()}
                  className="w-full"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {feedbackSubmitted && (
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Thank you for your review!</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneDetail;
