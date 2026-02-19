import { CreateEscrowRequest, CreateEscrowResponse, Escrow } from '@/types/escrow';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createEscrow(data: CreateEscrowRequest): Promise<CreateEscrowResponse> {
    return this.request('/escrow/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async depositFunds(escrowId: string, clientWallet: string) {
    return this.request('/escrow/deposit', {
      method: 'POST',
      body: JSON.stringify({ escrowId, clientWallet }),
    });
  }

  async getEscrow(escrowId: string): Promise<Escrow> {
    return this.request(`/escrow/${escrowId}`);
  }

  async getWalletEscrows(walletAddress: string): Promise<Escrow[]> {
    return this.request(`/escrow/wallet/${walletAddress}`);
  }

  async submitMilestone(milestoneId: string, freelancerWallet: string, proofUrl: string) {
    return this.request('/milestone/submit', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, freelancerWallet, proofUrl }),
    });
  }

  async approveMilestone(milestoneId: string, clientWallet: string) {
    return this.request('/milestone/approve', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, clientWallet }),
    });
  }

  async rejectMilestone(milestoneId: string, clientWallet: string, reason: string) {
    return this.request('/milestone/reject', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, clientWallet, reason }),
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
