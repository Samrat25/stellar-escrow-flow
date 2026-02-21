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

  // ===== ESCROW ENDPOINTS =====

  async createEscrow(data: CreateEscrowRequest & { deadline: string }): Promise<CreateEscrowResponse> {
    return this.request('/escrow/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeEscrow(txHash: string, contractId: string, escrowData: any) {
    return this.request('/escrow/complete', {
      method: 'POST',
      body: JSON.stringify({ txHash, contractId, escrowData }),
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

  // ===== MILESTONE ENDPOINTS =====

  async createMilestone(data: { clientWallet: string; freelancerWallet: string; amount: number; mode: string }) {
    return this.request('/milestone/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeMilestoneCreation(data: { txHash: string; contractId: string; escrowId: string; clientWallet: string; freelancerWallet: string; amount: number; mode: string }) {
    return this.request('/milestone/complete-creation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fundMilestone(milestoneId: string, clientWallet: string, mode: string) {
    return this.request('/milestone/fund', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, clientWallet, mode }),
    });
  }

  async submitMilestone(milestoneId: string, freelancerWallet: string, submissionHash: string, mode: string) {
    return this.request('/milestone/submit', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, freelancerWallet, submissionHash, mode }),
    });
  }

  async approveMilestone(milestoneId: string, clientWallet: string, mode: string) {
    return this.request('/milestone/approve', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, clientWallet, mode }),
    });
  }

  async disputeMilestone(milestoneId: string, walletAddress: string) {
    return this.request('/milestone/dispute', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, walletAddress }),
    });
  }

  async refundMilestone(milestoneId: string, clientWallet: string, mode: string) {
    return this.request('/milestone/refund', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, clientWallet, mode }),
    });
  }

  async getMilestone(milestoneId: string) {
    return this.request(`/milestone/${milestoneId}`);
  }

  // ===== FEEDBACK ENDPOINTS =====

  async submitFeedback(escrowId: string, userId: string, rating: number, comment?: string, category?: string) {
    return this.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ escrowId, userId, rating, comment, category }),
    });
  }

  async getEscrowFeedback(escrowId: string) {
    return this.request(`/feedback/escrow/${escrowId}`);
  }

  async getUserFeedback(userId: string) {
    return this.request(`/feedback/user/${userId}`);
  }

  async getFeedbackStats() {
    return this.request('/feedback/stats');
  }

  // ===== USER ENDPOINTS =====

  async getUser(walletAddress: string) {
    return this.request(`/user/${walletAddress}`);
  }

  async getUserDashboard(walletAddress: string, mode: 'BUYING' | 'SELLING') {
    return this.request(`/user/${walletAddress}/dashboard?mode=${mode}`);
  }

  async updateUser(walletAddress: string, data: { displayName?: string; email?: string }) {
    return this.request(`/user/${walletAddress}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserReputation(walletAddress: string) {
    return this.request(`/user/${walletAddress}/reputation`);
  }

  // ===== MODE-BASED ESCROW ENDPOINTS =====

  async getEscrows(walletAddress: string, mode: 'BUYING' | 'SELLING'): Promise<Escrow[]> {
    return this.request(`/escrow/list?address=${walletAddress}&mode=${mode}`);
  }

  // ===== AGENT ENDPOINTS =====

  async getAgentStatus() {
    return this.request('/agent/status');
  }

  async getAgentLogs(params?: { agentType?: string; status?: string; escrowId?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.agentType) queryParams.append('agentType', params.agentType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.escrowId) queryParams.append('escrowId', params.escrowId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/agent/logs${query ? '?' + query : ''}`);
  }

  async getPendingActions() {
    return this.request('/agent/pending-actions');
  }

  async testAgent() {
    return this.request('/agent/test', { method: 'POST' });
  }

  // ===== HEALTH CHECK =====

  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
