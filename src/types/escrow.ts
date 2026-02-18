export type EscrowState = 'CREATED' | 'FUNDED' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'COMPLETED';
export type MilestoneStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type UserRole = 'client' | 'freelancer';

export interface Milestone {
  id: string;
  escrowId: string;
  milestoneNumber: number;
  description: string;
  amount: number;
  status: MilestoneStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export interface Escrow {
  id: string;
  contractId: string;
  clientWallet: string;
  freelancerWallet: string;
  totalAmount: number;
  status: EscrowState;
  deadline: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface User {
  id: string;
  walletAddress: string;
  role: UserRole;
  reputation: number;
  createdAt: string;
}

export interface Feedback {
  id: string;
  walletAddress: string;
  feedbackText: string;
  rating: number;
  createdAt: string;
}

export interface MilestoneInput {
  description: string;
  amount: string;
}
