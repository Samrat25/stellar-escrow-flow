import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStellarWallet } from '@/contexts/WalletContext';
import { useMode } from '@/contexts/ModeContext';
import { Activity, Clock, CheckCircle2, Plus, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatXLM } from '@/lib/stellar';
import RoleInfo from '@/components/RoleInfo';

const Dashboard = () => {
  const { address } = useStellarWallet();
  const { mode } = useMode();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
    loadMilestones();
  }, [address, mode]);

  const loadMilestones = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const escrows = await api.getEscrows(address, mode);
      // Extract all milestones from escrows
      const allMilestones = escrows.flatMap(escrow => 
        (escrow.milestones || []).map(m => ({
          ...m,
          escrow
        }))
      );
      setMilestones(allMilestones);
    } catch (error) {
      toast.error(`Failed to load milestones`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fundedMilestones = milestones.filter(m => m.status === 'FUNDED' || m.status === 'SUBMITTED');
  const completedMilestones = milestones.filter(m => m.status === 'APPROVED');
  
  const totalLocked = fundedMilestones.reduce((sum, m) => sum + m.amount, 0);
  const totalReleased = completedMilestones.reduce((sum, m) => sum + m.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-grid pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {mode === 'BUYING' ? 'Client' : 'Freelancer'} Dashboard
              </h1>
              <Badge variant={mode === 'BUYING' ? 'default' : 'secondary'} className="text-xs">
                {mode}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {mode === 'BUYING' 
                ? 'Create and fund milestones' 
                : 'Complete work and receive payments'}
            </p>
          </div>
          {mode === 'BUYING' && (
            <Link to="/create-milestone">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Milestone
              </Button>
            </Link>
          )}
        </div>

        <RoleInfo role={mode === 'BUYING' ? 'buyer' : 'seller'} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Activity className="h-3.5 w-3.5" /> Total Milestones
              </div>
              <div className="text-2xl font-bold">{milestones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Clock className="h-3.5 w-3.5" /> Active
              </div>
              <div className="text-2xl font-bold">{fundedMilestones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </div>
              <div className="text-2xl font-bold">{completedMilestones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <DollarSign className="h-3.5 w-3.5" /> {mode === 'BUYING' ? 'Locked' : 'Earned'}
              </div>
              <div className="text-2xl font-bold">
                {formatXLM(mode === 'BUYING' ? totalLocked : totalReleased)}
              </div>
            </CardContent>
          </Card>
        </div>

        {milestones.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">
                {mode === 'BUYING' ? 'No milestones created yet' : 'No milestones assigned yet'}
              </p>
              {mode === 'BUYING' && (
                <Link to="/create-milestone">
                  <Button>Create Your First Milestone</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="border-border hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Milestone #{milestone.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    </div>
                    <Badge variant={
                      milestone.status === 'APPROVED' ? 'default' : 
                      milestone.status === 'FUNDED' ? 'secondary' : 
                      'outline'
                    }>
                      {milestone.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {mode === 'BUYING' ? 'Freelancer' : 'Client'}
                    </span>
                    <span className="font-mono text-xs">
                      {mode === 'BUYING' 
                        ? milestone.escrow.freelancerWallet.slice(0, 8) 
                        : milestone.escrow.clientWallet.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-primary">{formatXLM(milestone.amount)}</span>
                  </div>
                  {milestone.status === 'FUNDED' && mode === 'BUYING' && (
                    <div className="text-xs text-muted-foreground">
                      💰 {formatXLM(milestone.amount)} locked in contract
                    </div>
                  )}
                  {milestone.status === 'APPROVED' && mode === 'SELLING' && (
                    <div className="text-xs text-green-600">
                      ✓ {formatXLM(milestone.amount)} released to your wallet
                    </div>
                  )}
                  <Link to={`/milestone/${milestone.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
