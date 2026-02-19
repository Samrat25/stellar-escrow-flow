export type EscrowState = 'CREATED' | 'FUNDED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type UserRole = 'client' | 'freelancer' | 'both';

export interface Milestone {
  id: string;
  escrow_id: string;
  milestone_index: number;
  description: string;
  amount: number;
  status: MilestoneStatus;
  proof_url?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  review_deadline?: string;
  auto_approved?: boolean;
  submission_tx_hash?: string;
  approval_tx_hash?: string;
  rejection_tx_hash?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Escrow {
  id: string;
  contract_id: string;
  client_wallet: string;
  freelancer_wallet: string;
  total_amount: number;
  status: EscrowState;
  review_window_days: number;
  creation_tx_hash?: string;
  deposit_tx_hash?: string;
  funded_at?: string;
  completed_at?: string;
  created_at: string;
  milestones?: Milestone[];
}

export interface User {
  id: string;
  wallet_address: string;
  role: UserRole;
  reputation: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  wallet_address: string;
  feedback_text: string;
  rating?: number;
  created_at: string;
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
