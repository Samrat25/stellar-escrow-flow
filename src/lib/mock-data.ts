import { Escrow, Feedback } from '@/types/escrow';

export const mockEscrows: Escrow[] = [
  {
    id: '1',
    contractId: 'CAAAA...BBBBB',
    clientWallet: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9',
    freelancerWallet: 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DSTL',
    totalAmount: 5000,
    status: 'FUNDED',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    milestones: [
      { id: 'm1', escrowId: '1', milestoneNumber: 1, description: 'UI Design Mockups', amount: 1500, status: 'APPROVED', submittedAt: '2026-02-10T10:00:00Z', approvedAt: '2026-02-11T10:00:00Z' },
      { id: 'm2', escrowId: '1', milestoneNumber: 2, description: 'Frontend Development', amount: 2000, status: 'SUBMITTED', submittedAt: '2026-02-15T10:00:00Z' },
      { id: 'm3', escrowId: '1', milestoneNumber: 3, description: 'Testing & Deployment', amount: 1500, status: 'PENDING' },
    ],
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: '2',
    contractId: 'CCCCC...DDDDD',
    clientWallet: 'GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPV',
    freelancerWallet: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9',
    totalAmount: 3000,
    status: 'CREATED',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    milestones: [
      { id: 'm4', escrowId: '2', milestoneNumber: 1, description: 'Smart Contract Audit', amount: 1500, status: 'PENDING' },
      { id: 'm5', escrowId: '2', milestoneNumber: 2, description: 'Documentation', amount: 1500, status: 'PENDING' },
    ],
    createdAt: '2026-02-12T10:00:00Z',
  },
];

export const mockFeedback: Feedback[] = [
  { id: '1', walletAddress: 'GCEZW...JRS9', feedbackText: 'Smooth milestone approval process. Very transparent!', rating: 5, createdAt: '2026-02-10T10:00:00Z' },
  { id: '2', walletAddress: 'GBDEV...DSTL', feedbackText: 'Auto-release feature saved my freelance payment.', rating: 4, createdAt: '2026-02-11T10:00:00Z' },
  { id: '3', walletAddress: 'GA7YN...OOPV', feedbackText: 'Would love multi-token support in future.', rating: 4, createdAt: '2026-02-12T10:00:00Z' },
];
