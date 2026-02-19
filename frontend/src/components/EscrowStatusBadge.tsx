import { EscrowState, MilestoneStatus } from '@/types/escrow';

const escrowColors: Record<EscrowState, string> = {
  CREATED: 'bg-info/15 text-info border-info/30',
  FUNDED: 'bg-primary/15 text-primary border-primary/30',
  SUBMITTED: 'bg-warning/15 text-warning border-warning/30',
  APPROVED: 'bg-success/15 text-success border-success/30',
  DISPUTED: 'bg-destructive/15 text-destructive border-destructive/30',
  COMPLETED: 'bg-success/15 text-success border-success/30',
};

const milestoneColors: Record<MilestoneStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground border-border',
  SUBMITTED: 'bg-warning/15 text-warning border-warning/30',
  APPROVED: 'bg-success/15 text-success border-success/30',
  REJECTED: 'bg-destructive/15 text-destructive border-destructive/30',
};

export const EscrowBadge = ({ status }: { status: EscrowState }) => (
  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${escrowColors[status]}`}>
    {status}
  </span>
);

export const MilestoneBadge = ({ status }: { status: MilestoneStatus }) => (
  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${milestoneColors[status]}`}>
    {status}
  </span>
);
