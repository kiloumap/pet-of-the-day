import { apiService } from './api';

export interface SharedNotebook {
  id: string;
  notebookId: string;
  petId: string;
  petName: string;
  notebookName: string;
  notebookType: 'medical' | 'diet' | 'habits' | 'commands' | 'general';
  ownerName: string;
  ownerEmail: string;
  shareType: 'read' | 'write' | 'admin';
  sharedAt: string;
  lastAccessed?: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface NotebookShare {
  id: string;
  notebookId: string;
  sharedWithEmail: string;
  sharedWithName?: string;
  shareType: 'read' | 'write' | 'admin';
  status: 'pending' | 'active' | 'revoked' | 'expired';
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  message?: string;
}

export interface ShareInvitation {
  id: string;
  type: 'notebook' | 'co-owner';
  from: {
    id: string;
    name: string;
    email: string;
  };
  resource: {
    id: string; // notebookId or petId
    name: string; // notebook name or pet name
    type?: string; // notebook type or pet species
  };
  shareType: 'read' | 'write' | 'admin' | 'co-owner';
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

export interface CreateShareRequest {
  email: string;
  shareType: 'read' | 'write' | 'admin';
  message?: string;
  expiresIn?: number; // days from now
}

export interface UpdateShareRequest {
  shareType?: 'read' | 'write' | 'admin';
  status?: 'active' | 'revoked';
  expiresAt?: string;
}

export class SharingService {
  // Shared notebooks management
  async getSharedNotebooks(): Promise<SharedNotebook[]> {
    try {
      const response = await apiService.getSharedNotebooks();
      return response.notebooks || response.shared_notebooks || [];
    } catch (error) {
      console.error('Failed to fetch shared notebooks:', error);
      throw error;
    }
  }

  async getNotebookShares(notebookId: string): Promise<NotebookShare[]> {
    try {
      const response = await apiService.getNotebookShares(notebookId);
      return response.shares || [];
    } catch (error) {
      console.error(`Failed to fetch shares for notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async createNotebookShare(notebookId: string, shareData: CreateShareRequest): Promise<NotebookShare> {
    try {
      const response = await apiService.createNotebookShare(notebookId, shareData);
      return response;
    } catch (error) {
      console.error(`Failed to create share for notebook ${notebookId}:`, error);
      throw error;
    }
  }

  async updateNotebookShare(
    notebookId: string,
    shareId: string,
    updates: UpdateShareRequest
  ): Promise<NotebookShare> {
    try {
      const response = await apiService.updateNotebookShare(notebookId, shareId, updates);
      return response;
    } catch (error) {
      console.error(`Failed to update share ${shareId}:`, error);
      throw error;
    }
  }

  async revokeNotebookShare(notebookId: string, shareId: string): Promise<void> {
    try {
      await apiService.deleteNotebookShare(notebookId, shareId);
    } catch (error) {
      console.error(`Failed to revoke share ${shareId}:`, error);
      throw error;
    }
  }

  // Invitation management
  async getPendingInvitations(): Promise<ShareInvitation[]> {
    try {
      const response = await apiService.getPendingInvites();
      return response.invitations || response.invites || [];
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
      throw error;
    }
  }

  async getSentInvitations(): Promise<ShareInvitation[]> {
    try {
      const response = await apiService.getSentInvites();
      return response.invitations || response.invites || [];
    } catch (error) {
      console.error('Failed to fetch sent invitations:', error);
      throw error;
    }
  }

  async acceptInvitation(invitationId: string): Promise<ShareInvitation> {
    try {
      const response = await apiService.acceptInvite(invitationId);
      return response;
    } catch (error) {
      console.error(`Failed to accept invitation ${invitationId}:`, error);
      throw error;
    }
  }

  async rejectInvitation(invitationId: string): Promise<ShareInvitation> {
    try {
      const response = await apiService.rejectInvite(invitationId);
      return response;
    } catch (error) {
      console.error(`Failed to reject invitation ${invitationId}:`, error);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await apiService.cancelInvite(invitationId);
    } catch (error) {
      console.error(`Failed to cancel invitation ${invitationId}:`, error);
      throw error;
    }
  }

  // Bulk operations
  async bulkAcceptInvitations(invitationIds: string[]): Promise<{
    accepted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const accepted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const invitationId of invitationIds) {
      try {
        await this.acceptInvitation(invitationId);
        accepted.push(invitationId);
      } catch (error) {
        failed.push({
          id: invitationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { accepted, failed };
  }

  async bulkRejectInvitations(invitationIds: string[]): Promise<{
    rejected: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const rejected: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const invitationId of invitationIds) {
      try {
        await this.rejectInvitation(invitationId);
        rejected.push(invitationId);
      } catch (error) {
        failed.push({
          id: invitationId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { rejected, failed };
  }

  // Share management helpers
  async shareNotebookWithMultipleUsers(
    notebookId: string,
    emails: string[],
    shareType: 'read' | 'write' | 'admin' = 'read',
    message?: string
  ): Promise<{
    successful: Array<{ email: string; shareId: string }>;
    failed: Array<{ email: string; error: string }>;
  }> {
    const successful: Array<{ email: string; shareId: string }> = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const email of emails) {
      try {
        const share = await this.createNotebookShare(notebookId, {
          email,
          shareType,
          message,
        });
        successful.push({ email, shareId: share.id });
      } catch (error) {
        failed.push({
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  // Permission checking
  async getUserPermissionForNotebook(notebookId: string): Promise<{
    hasAccess: boolean;
    permission: 'read' | 'write' | 'admin' | 'owner' | null;
    shareId?: string;
  }> {
    try {
      // This would typically be handled by the API, but for now we simulate it
      const sharedNotebooks = await this.getSharedNotebooks();
      const notebook = sharedNotebooks.find(n => n.notebookId === notebookId);

      if (notebook) {
        return {
          hasAccess: true,
          permission: notebook.shareType,
          shareId: notebook.id,
        };
      }

      return {
        hasAccess: false,
        permission: null,
      };
    } catch (error) {
      console.error(`Failed to check permissions for notebook ${notebookId}:`, error);
      return {
        hasAccess: false,
        permission: null,
      };
    }
  }

  // Statistics and insights
  async getSharingStats(): Promise<{
    totalSharedNotebooks: number;
    notebooksIShare: number;
    notebooksSharedWithMe: number;
    pendingInvitations: number;
    mostSharedNotebookTypes: Array<{ type: string; count: number }>;
    recentActivity: Array<{
      type: 'invited' | 'accepted' | 'shared';
      date: string;
      description: string;
    }>;
  }> {
    try {
      const [sharedNotebooks, pendingInvites, sentInvites] = await Promise.all([
        this.getSharedNotebooks(),
        this.getPendingInvitations(),
        this.getSentInvitations(),
      ]);

      // Count notebook types
      const notebookTypeCounts = sharedNotebooks.reduce((acc, notebook) => {
        acc[notebook.notebookType] = (acc[notebook.notebookType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostSharedNotebookTypes = Object.entries(notebookTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Recent activity (simplified)
      const recentActivity = [
        ...pendingInvites.map(invite => ({
          type: 'invited' as const,
          date: invite.createdAt,
          description: `Invited to ${invite.resource.name}`,
        })),
        ...sentInvites
          .filter(invite => invite.status === 'accepted')
          .map(invite => ({
            type: 'accepted' as const,
            date: invite.acceptedAt || invite.createdAt,
            description: `${invite.sharedWithEmail} accepted invitation`,
          })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      return {
        totalSharedNotebooks: sharedNotebooks.length,
        notebooksIShare: sentInvites.length,
        notebooksSharedWithMe: sharedNotebooks.length,
        pendingInvitations: pendingInvites.length,
        mostSharedNotebookTypes,
        recentActivity,
      };
    } catch (error) {
      console.error('Failed to get sharing stats:', error);
      throw error;
    }
  }

  // Search and filtering
  async searchSharedNotebooks(query: string): Promise<SharedNotebook[]> {
    try {
      const sharedNotebooks = await this.getSharedNotebooks();
      return sharedNotebooks.filter(notebook =>
        notebook.notebookName.toLowerCase().includes(query.toLowerCase()) ||
        notebook.petName.toLowerCase().includes(query.toLowerCase()) ||
        notebook.ownerName.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search shared notebooks:', error);
      throw error;
    }
  }

  async getSharedNotebooksByType(type: SharedNotebook['notebookType']): Promise<SharedNotebook[]> {
    try {
      const sharedNotebooks = await this.getSharedNotebooks();
      return sharedNotebooks.filter(notebook => notebook.notebookType === type);
    } catch (error) {
      console.error(`Failed to get shared notebooks of type ${type}:`, error);
      throw error;
    }
  }

  // Validation helpers
  validateShareData(data: CreateShareRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (!['read', 'write', 'admin'].includes(data.shareType)) {
      errors.push('Invalid share type');
    }

    if (data.expiresIn && (data.expiresIn < 1 || data.expiresIn > 365)) {
      errors.push('Expiration must be between 1 and 365 days');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Utility methods
  formatShareType(shareType: string): string {
    switch (shareType) {
      case 'read':
        return 'View only';
      case 'write':
        return 'Can edit';
      case 'admin':
        return 'Full access';
      case 'co-owner':
        return 'Co-owner';
      default:
        return shareType;
    }
  }

  isShareExpired(share: NotebookShare): boolean {
    if (!share.expiresAt) return false;
    return new Date(share.expiresAt) < new Date();
  }

  isInvitationExpired(invitation: ShareInvitation): boolean {
    if (!invitation.expiresAt) return false;
    return new Date(invitation.expiresAt) < new Date();
  }

  getDaysUntilExpiration(expiresAt: string): number {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const sharingService = new SharingService();
export default sharingService;