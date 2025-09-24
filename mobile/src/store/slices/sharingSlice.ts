import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '../../types/api';

// Types for sharing functionality
export interface NotebookShare {
  id: string;
  notebookId: string;
  userId: string;
  permission: SharePermission;
  sharedAt: string;
  sharedBy: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CoOwnerRelationship {
  id: string;
  petId: string;
  userId: string;
  relationshipType: CoOwnerType;
  invitedAt: string;
  invitedBy: string;
  acceptedAt?: string;
  status: RelationshipStatus;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SharedNotebook {
  id: string;
  petId: string;
  petName: string;
  primaryOwnerId: string;
  shares: NotebookShare[];
  totalEntries: number;
  lastEntryDate?: string;
  pet?: {
    id: string;
    name: string;
    breed: string;
    photoUrl?: string;
  };
}

export enum SharePermission {
  VIEW_ONLY = 'view_only',
  EDIT = 'edit',
  ADMIN = 'admin',
}

export enum CoOwnerType {
  CO_OWNER = 'co_owner',
  VIEWER = 'viewer',
  CARETAKER = 'caretaker',
}

export enum RelationshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  REVOKED = 'revoked',
}

// Request/Response types
export interface ShareNotebookRequest {
  notebookId: string;
  userEmail: string;
  permission: SharePermission;
  message?: string;
}

export interface InviteCoOwnerRequest {
  petId: string;
  userEmail: string;
  relationshipType: CoOwnerType;
  message?: string;
}

export interface UpdateSharePermissionRequest {
  shareId: string;
  permission: SharePermission;
}

export interface UpdateCoOwnerRelationshipRequest {
  relationshipId: string;
  relationshipType: CoOwnerType;
}

export interface AcceptCoOwnerInviteRequest {
  relationshipId: string;
}

export interface RevokeShareRequest {
  shareId: string;
}

export interface RevokeCoOwnerRelationshipRequest {
  relationshipId: string;
}

// State interface
export interface SharingState {
  // Notebook sharing
  notebookShares: NotebookShare[];
  sharedNotebooks: SharedNotebook[];

  // Co-ownership
  coOwnerRelationships: CoOwnerRelationship[];
  pendingInvites: CoOwnerRelationship[];
  myCoOwnedPets: SharedNotebook[];

  // UI state
  isLoading: boolean;
  isSharing: boolean;
  isInviting: boolean;
  error: string | null;

  // Modal state
  shareModalVisible: boolean;
  inviteModalVisible: boolean;
  selectedNotebookId: string | null;
  selectedPetId: string | null;
}

const initialState: SharingState = {
  notebookShares: [],
  sharedNotebooks: [],
  coOwnerRelationships: [],
  pendingInvites: [],
  myCoOwnedPets: [],
  isLoading: false,
  isSharing: false,
  isInviting: false,
  error: null,
  shareModalVisible: false,
  inviteModalVisible: false,
  selectedNotebookId: null,
  selectedPetId: null,
};

// Async thunks for API calls (mock implementation ready for backend integration)

export const shareNotebook = createAsyncThunk(
  'sharing/shareNotebook',
  async (request: ShareNotebookRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock success response
      const mockShare: NotebookShare = {
        id: `share_${Date.now()}`,
        notebookId: request.notebookId,
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        permission: request.permission,
        sharedAt: new Date().toISOString(),
        sharedBy: 'current_user_id',
        user: {
          id: `user_${Math.random().toString(36).substr(2, 9)}`,
          firstName: 'John',
          lastName: 'Doe',
          email: request.userEmail,
        },
      };

      return mockShare;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to share notebook',
        code: error.code || 'SHARE_NOTEBOOK_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const inviteCoOwner = createAsyncThunk(
  'sharing/inviteCoOwner',
  async (request: InviteCoOwnerRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock success response
      const mockRelationship: CoOwnerRelationship = {
        id: `relationship_${Date.now()}`,
        petId: request.petId,
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        relationshipType: request.relationshipType,
        invitedAt: new Date().toISOString(),
        invitedBy: 'current_user_id',
        status: RelationshipStatus.PENDING,
        user: {
          id: `user_${Math.random().toString(36).substr(2, 9)}`,
          firstName: 'Jane',
          lastName: 'Smith',
          email: request.userEmail,
        },
      };

      return mockRelationship;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to invite co-owner',
        code: error.code || 'INVITE_CO_OWNER_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const fetchSharedNotebooks = createAsyncThunk(
  'sharing/fetchSharedNotebooks',
  async (_, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock success response
      const mockSharedNotebooks: SharedNotebook[] = [
        {
          id: 'notebook_1',
          petId: 'pet_1',
          petName: 'Buddy',
          primaryOwnerId: 'owner_1',
          totalEntries: 15,
          lastEntryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          shares: [
            {
              id: 'share_1',
              notebookId: 'notebook_1',
              userId: 'current_user',
              permission: SharePermission.VIEW_ONLY,
              sharedAt: new Date().toISOString(),
              sharedBy: 'owner_1',
            },
          ],
          pet: {
            id: 'pet_1',
            name: 'Buddy',
            breed: 'Golden Retriever',
            photoUrl: 'https://example.com/buddy.jpg',
          },
        },
      ];

      return mockSharedNotebooks;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to fetch shared notebooks',
        code: error.code || 'FETCH_SHARED_NOTEBOOKS_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const fetchCoOwnerRelationships = createAsyncThunk(
  'sharing/fetchCoOwnerRelationships',
  async (petId: string, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock success response
      const mockRelationships: CoOwnerRelationship[] = [
        {
          id: 'relationship_1',
          petId,
          userId: 'user_2',
          relationshipType: CoOwnerType.CO_OWNER,
          invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          invitedBy: 'current_user',
          acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          status: RelationshipStatus.ACCEPTED,
          user: {
            id: 'user_2',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
          },
        },
      ];

      return mockRelationships;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to fetch co-owner relationships',
        code: error.code || 'FETCH_CO_OWNER_RELATIONSHIPS_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const fetchPendingInvites = createAsyncThunk(
  'sharing/fetchPendingInvites',
  async (_, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock success response
      const mockPendingInvites: CoOwnerRelationship[] = [
        {
          id: 'relationship_pending_1',
          petId: 'pet_external_1',
          userId: 'current_user',
          relationshipType: CoOwnerType.VIEWER,
          invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          invitedBy: 'owner_external',
          status: RelationshipStatus.PENDING,
          user: {
            id: 'owner_external',
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'bob.wilson@example.com',
          },
        },
      ];

      return mockPendingInvites;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to fetch pending invites',
        code: error.code || 'FETCH_PENDING_INVITES_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const acceptCoOwnerInvite = createAsyncThunk(
  'sharing/acceptCoOwnerInvite',
  async (request: AcceptCoOwnerInviteRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      return request.relationshipId;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to accept co-owner invite',
        code: error.code || 'ACCEPT_CO_OWNER_INVITE_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const rejectCoOwnerInvite = createAsyncThunk(
  'sharing/rejectCoOwnerInvite',
  async (relationshipId: string, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      return relationshipId;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to reject co-owner invite',
        code: error.code || 'REJECT_CO_OWNER_INVITE_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const revokeShare = createAsyncThunk(
  'sharing/revokeShare',
  async (request: RevokeShareRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      return request.shareId;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to revoke share',
        code: error.code || 'REVOKE_SHARE_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const revokeCoOwnerRelationship = createAsyncThunk(
  'sharing/revokeCoOwnerRelationship',
  async (request: RevokeCoOwnerRelationshipRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      return request.relationshipId;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to revoke co-owner relationship',
        code: error.code || 'REVOKE_CO_OWNER_RELATIONSHIP_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

export const updateSharePermission = createAsyncThunk(
  'sharing/updateSharePermission',
  async (request: UpdateSharePermissionRequest, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      return request;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Failed to update share permission',
        code: error.code || 'UPDATE_SHARE_PERMISSION_ERROR',
        details: error.details,
      };
      return rejectWithValue(apiError);
    }
  }
);

// Slice definition
const sharingSlice = createSlice({
  name: 'sharing',
  initialState,
  reducers: {
    // Modal control actions
    showShareModal: (state, action: PayloadAction<string>) => {
      state.shareModalVisible = true;
      state.selectedNotebookId = action.payload;
      state.error = null;
    },
    hideShareModal: (state) => {
      state.shareModalVisible = false;
      state.selectedNotebookId = null;
      state.error = null;
    },
    showInviteModal: (state, action: PayloadAction<string>) => {
      state.inviteModalVisible = true;
      state.selectedPetId = action.payload;
      state.error = null;
    },
    hideInviteModal: (state) => {
      state.inviteModalVisible = false;
      state.selectedPetId = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Local state updates
    addNotebookShare: (state, action: PayloadAction<NotebookShare>) => {
      state.notebookShares.push(action.payload);
    },
    removeNotebookShare: (state, action: PayloadAction<string>) => {
      state.notebookShares = state.notebookShares.filter(share => share.id !== action.payload);
    },
    addCoOwnerRelationship: (state, action: PayloadAction<CoOwnerRelationship>) => {
      state.coOwnerRelationships.push(action.payload);
    },
    removeCoOwnerRelationship: (state, action: PayloadAction<string>) => {
      state.coOwnerRelationships = state.coOwnerRelationships.filter(rel => rel.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Share notebook
    builder
      .addCase(shareNotebook.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(shareNotebook.fulfilled, (state, action) => {
        state.isSharing = false;
        state.notebookShares.push(action.payload);
        state.shareModalVisible = false;
        state.selectedNotebookId = null;
      })
      .addCase(shareNotebook.rejected, (state, action) => {
        state.isSharing = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to share notebook';
      });

    // Invite co-owner
    builder
      .addCase(inviteCoOwner.pending, (state) => {
        state.isInviting = true;
        state.error = null;
      })
      .addCase(inviteCoOwner.fulfilled, (state, action) => {
        state.isInviting = false;
        state.coOwnerRelationships.push(action.payload);
        state.inviteModalVisible = false;
        state.selectedPetId = null;
      })
      .addCase(inviteCoOwner.rejected, (state, action) => {
        state.isInviting = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to invite co-owner';
      });

    // Fetch shared notebooks
    builder
      .addCase(fetchSharedNotebooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSharedNotebooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sharedNotebooks = action.payload;
      })
      .addCase(fetchSharedNotebooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to fetch shared notebooks';
      });

    // Fetch co-owner relationships
    builder
      .addCase(fetchCoOwnerRelationships.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoOwnerRelationships.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coOwnerRelationships = action.payload;
      })
      .addCase(fetchCoOwnerRelationships.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to fetch co-owner relationships';
      });

    // Fetch pending invites
    builder
      .addCase(fetchPendingInvites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingInvites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingInvites = action.payload;
      })
      .addCase(fetchPendingInvites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to fetch pending invites';
      });

    // Accept co-owner invite
    builder
      .addCase(acceptCoOwnerInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptCoOwnerInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        const relationshipId = action.payload;
        const relationship = state.pendingInvites.find(rel => rel.id === relationshipId);
        if (relationship) {
          relationship.status = RelationshipStatus.ACCEPTED;
          relationship.acceptedAt = new Date().toISOString();
          // Move from pending to accepted relationships
          state.pendingInvites = state.pendingInvites.filter(rel => rel.id !== relationshipId);
          state.coOwnerRelationships.push(relationship);
        }
      })
      .addCase(acceptCoOwnerInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to accept invite';
      });

    // Reject co-owner invite
    builder
      .addCase(rejectCoOwnerInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectCoOwnerInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        const relationshipId = action.payload;
        state.pendingInvites = state.pendingInvites.filter(rel => rel.id !== relationshipId);
      })
      .addCase(rejectCoOwnerInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to reject invite';
      });

    // Revoke share
    builder
      .addCase(revokeShare.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeShare.fulfilled, (state, action) => {
        state.isLoading = false;
        const shareId = action.payload;
        state.notebookShares = state.notebookShares.filter(share => share.id !== shareId);
      })
      .addCase(revokeShare.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to revoke share';
      });

    // Revoke co-owner relationship
    builder
      .addCase(revokeCoOwnerRelationship.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeCoOwnerRelationship.fulfilled, (state, action) => {
        state.isLoading = false;
        const relationshipId = action.payload;
        state.coOwnerRelationships = state.coOwnerRelationships.filter(rel => rel.id !== relationshipId);
      })
      .addCase(revokeCoOwnerRelationship.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to revoke relationship';
      });

    // Update share permission
    builder
      .addCase(updateSharePermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSharePermission.fulfilled, (state, action) => {
        state.isLoading = false;
        const { shareId, permission } = action.payload;
        const share = state.notebookShares.find(s => s.id === shareId);
        if (share) {
          share.permission = permission;
        }
      })
      .addCase(updateSharePermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to update permission';
      });
  },
});

export const {
  showShareModal,
  hideShareModal,
  showInviteModal,
  hideInviteModal,
  clearError,
  addNotebookShare,
  removeNotebookShare,
  addCoOwnerRelationship,
  removeCoOwnerRelationship,
} = sharingSlice.actions;

export default sharingSlice.reducer;