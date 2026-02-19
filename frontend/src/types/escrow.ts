export type EscrowState = 'CREATED' | 'FUNDED' | 'ACTIVE' | 'COMPLETED';
export type MilestoneStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Milestone {
  id: string;
  escrowId: string;
  milestoneIndex: number;
  description: string;
  amount: number;
  status: MilestoneStatus;
  proofUrl?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewDeadline?: string;
  autoApproved?: boolean;
  submissionTxHash?: string;
  approvalTxHash?: string;
  rejectionTxHash?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Escrow {
  id: string;
  contractId: string;
  clientWallet: string;
  freelancerWallet: string;
  totalAmount: number;
  status: EscrowState;
  reviewWindowDays: number;
  creationTxHash?: string;
  depositTxHash?: string;
  fundedAt?: string;
  completedAt?: string;
  createdAt: string;
  milestones?: Milestone[];
}

export interface MilestoneInput {
  description: string;
  amount: string;
}

export interface CreateEscrowRequest {
  clientWallet: string;
  freelancerWallet: string;
  milestones: MilestoneInput[];
  reviewWindowDays: number;
}

export interface CreateEscrowResponse {
  success: boolean;
  escrowId: string;
  contractId: string;
  txHash: string;
  explorerUrl: string;
}
