import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EscrowBadge, MilestoneBadge } from './EscrowStatusBadge';
import { Escrow } from '@/types/escrow';
import { truncateAddress, formatXLM, getExplorerUrl } from '@/lib/stellar';
import { Progress } from '@/components/ui/progress';

interface EscrowCardProps {
  escrow: Escrow;
  onApprove?: (escrowId: string, milestoneId: string) => void;
  onReject?: (escrowId: string, milestoneId: string) => void;
  onSubmit?: (escrowId: string, milestoneId: string) => void;
}

const EscrowCard = ({ escrow, onApprove, onReject, onSubmit }: EscrowCardProps) => {
  const approvedCount = escrow.milestones?.filter(m => m.status === 'APPROVED').length || 0;
  const progress = escrow.milestones ? (approvedCount / escrow.milestones.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border bg-card hover:glow-border transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">#{escrow.id.slice(0, 8)}</span>
              <EscrowBadge status={escrow.status} />
            </div>
            <a
              href={getExplorerUrl(escrow.contractId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Client</p>
              <p className="font-mono text-xs">{truncateAddress(escrow.clientWallet)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Freelancer</p>
              <p className="font-mono text-xs">{truncateAddress(escrow.freelancerWallet)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gradient">{formatXLM(escrow.totalAmount)}</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{escrow.reviewWindowDays}d review</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Milestone Progress</span>
              <span>{approvedCount}/{escrow.milestones?.length || 0}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {escrow.milestones && escrow.milestones.length > 0 && (
            <div className="space-y-2">
              {escrow.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{milestone.milestoneIndex}</span>
                    <span className="text-sm">{milestone.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{formatXLM(milestone.amount)}</span>
                    <MilestoneBadge status={milestone.status} />
                    {milestone.status === 'PENDING' && onSubmit && (
                      <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onSubmit(escrow.id, milestone.id)}>
                        Submit
                      </Button>
                    )}
                    {milestone.status === 'SUBMITTED' && onApprove && (
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-xs" onClick={() => onApprove(escrow.id, milestone.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => onReject && onReject(escrow.id, milestone.id)}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EscrowCard;
