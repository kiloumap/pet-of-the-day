import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../services/api';
import {
  Group,
  Membership,
  Invitation,
  ApiError,
  CreateGroupRequest,
  UpdateGroupRequest,
  JoinGroupRequest,
  AcceptInvitationRequest,
  InviteToGroupRequest,
  UpdateMembershipPetsRequest,
} from '../types/api';

export interface GroupState {
  groups: Group[];
  createdGroups: Group[];
  joinedGroups: { group: Group; membership: Membership }[];
  currentGroup: Group | null;
  currentGroupMembers: Membership[];
  currentGroupInvitations: Invitation[];

  isLoading: boolean;
  isCreating: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isInviting: boolean;
  isUpdatingPets: boolean;

  error: ApiError | null;

  isCreator: boolean;
  userMembership: Membership | null;
}

const initialState: GroupState = {
  groups: [],
  createdGroups: [],
  joinedGroups: [],
  currentGroup: null,
  currentGroupMembers: [],
  currentGroupInvitations: [],
  isLoading: false,
  isCreating: false,
  isJoining: false,
  isLeaving: false,
  isInviting: false,
  isUpdatingPets: false,
  error: null,
  isCreator: false,
  userMembership: null,
};

export const fetchUserGroups = createAsyncThunk(
  'groups/fetchUserGroups',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getUserGroups(userId);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (data: CreateGroupRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.createGroup(data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const fetchGroup = createAsyncThunk(
  'groups/fetchGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getGroup(groupId);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'groups/fetchGroupMembers',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getGroupMembers(groupId);
      return response;
    } catch (error) {
      console.error('❌ Error fetching group members:', error);
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const joinGroup = createAsyncThunk(
  'groups/joinGroup',
  async ({ groupId, data }: { groupId: string; data: JoinGroupRequest }, { rejectWithValue }) => {
    try {
      const response = await apiService.joinGroup(groupId, data);
      return { response, groupId };
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      await apiService.leaveGroup(groupId);
      return groupId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const inviteToGroup = createAsyncThunk(
  'groups/inviteToGroup',
  async ({ groupId, data }: { groupId: string; data: InviteToGroupRequest }, { rejectWithValue }) => {
    try {
      const response = await apiService.inviteToGroup(groupId, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const acceptInvitation = createAsyncThunk(
  'groups/acceptInvitation',
  async (data: AcceptInvitationRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.acceptInvitation(data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const declineInvitation = createAsyncThunk(
  'groups/declineInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      await apiService.declineInvitation(invitationId);
      return invitationId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const dismissInvitation = createAsyncThunk(
  'groups/dismissInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      return invitationId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async (data: UpdateGroupRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.updateGroup(data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const updateMembershipPets = createAsyncThunk(
  'groups/updateMembershipPets',
  async (data: UpdateMembershipPetsRequest, { rejectWithValue }) => {
    try {
      await apiService.updateMembershipPets(data);
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
      state.currentGroupMembers = [];
      state.currentGroupInvitations = [];
      state.isCreator = false;
      state.userMembership = null;
    },
    resetGroupState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.createdGroups = action.payload.created_groups;
        state.joinedGroups = action.payload.joined_groups;
        state.groups = [
          ...action.payload.created_groups,
          ...action.payload.joined_groups.map(jg => jg.group)
        ];
        state.error = null;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(createGroup.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isCreating = false;
        const newGroup: Group = {
          id: action.payload.id,
          name: action.payload.name,
          description: action.payload.description,
          privacy: action.payload.privacy as 'private' | 'public',
          creator_id: action.payload.creator_id,
          created_at: action.payload.created_at,
        };
        state.createdGroups.push(newGroup);
        state.groups.push(newGroup);

        // Store the invite code created automatically
        if (action.payload.invite_code) {
          const newInvitation: Invitation = {
            id: 'auto-generated',
            group_id: action.payload.id,
            invite_type: 'code',
            invite_code: action.payload.invite_code,
            status: 'pending',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: action.payload.created_at,
          };
          state.currentGroupInvitations.push(newInvitation);
        }

        // Creator automatically becomes a member
        if (action.payload.membership) {
          const membership: Membership = {
            id: action.payload.membership.id,
            group_id: action.payload.membership.group_id,
            user_id: action.payload.membership.user_id,
            pet_ids: action.payload.membership.pet_ids,
            status: action.payload.membership.status,
            joined_at: action.payload.membership.created_at,
          };
          state.joinedGroups.push({ group: newGroup, membership });
        }

        state.error = null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(fetchGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload.group;
        state.isCreator = action.payload.is_creator;
        state.userMembership = action.payload.membership || null;
        state.error = null;
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(fetchGroupMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroupMembers = action.payload.members;
        state.currentGroupInvitations = action.payload.invitations || [];
        state.error = null;
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(joinGroup.pending, (state) => {
        state.isJoining = true;
        state.error = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.isJoining = false;
        state.userMembership = {
          id: action.payload.response.id,
          group_id: action.payload.response.group_id,
          user_id: action.payload.response.user_id,
          pet_ids: action.payload.response.pet_ids,
          status: action.payload.response.status,
          joined_at: new Date().toISOString(),
        };
        state.error = null;
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.isJoining = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(leaveGroup.pending, (state) => {
        state.isLeaving = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.isLeaving = false;
        state.userMembership = null;
        state.joinedGroups = state.joinedGroups.filter(
          jg => jg.group.id !== action.payload
        );
        state.groups = state.groups.filter(
          group => group.id !== action.payload ||
          state.createdGroups.some(cg => cg.id === group.id)
        );
        state.error = null;
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.isLeaving = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(inviteToGroup.pending, (state) => {
        state.isInviting = true;
        state.error = null;
      })
      .addCase(inviteToGroup.fulfilled, (state, action) => {
        state.isInviting = false;
        if (state.currentGroup && state.currentGroup.id === action.payload.group_id) {
          const newInvitation: Invitation = {
            id: action.payload.id,
            group_id: action.payload.group_id,
            invite_type: action.payload.invite_type as 'email' | 'code',
            invite_code: action.payload.invite_code,
            status: 'pending',
            expires_at: action.payload.expires_at,
            created_at: action.payload.created_at,
          };
          state.currentGroupInvitations.push(newInvitation);
        }
        state.error = null;
      })
      .addCase(inviteToGroup.rejected, (state, action) => {
        state.isInviting = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(acceptInvitation.pending, (state) => {
        state.isJoining = true;
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.isJoining = false;
        state.userMembership = {
          id: action.payload.id,
          group_id: action.payload.group_id,
          user_id: action.payload.user_id,
          pet_ids: action.payload.pet_ids,
          status: action.payload.status,
          joined_at: new Date().toISOString(),
        };
        state.error = null;
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.isJoining = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentGroup && state.currentGroup.id === action.payload.id) {
          state.currentGroup = {
            ...state.currentGroup,
            name: action.payload.name,
            description: action.payload.description,
            privacy: action.payload.privacy,
          };
        }
        const createdIndex = state.createdGroups.findIndex(g => g.id === action.payload.id);
        if (createdIndex !== -1) {
          state.createdGroups[createdIndex] = {
            ...state.createdGroups[createdIndex],
            name: action.payload.name,
            description: action.payload.description,
            privacy: action.payload.privacy,
          };
        }
        const joinedIndex = state.joinedGroups.findIndex(jg => jg.group.id === action.payload.id);
        if (joinedIndex !== -1) {
          state.joinedGroups[joinedIndex].group = {
            ...state.joinedGroups[joinedIndex].group,
            name: action.payload.name,
            description: action.payload.description,
            privacy: action.payload.privacy,
          };
        }
        state.error = null;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(deleteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const groupId = action.payload;
        state.createdGroups = state.createdGroups.filter(g => g.id !== groupId);
        state.joinedGroups = state.joinedGroups.filter(jg => jg.group.id !== groupId);
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = null;
          state.currentGroupMembers = [];
          state.currentGroupInvitations = [];
          state.isCreator = false;
          state.userMembership = null;
        }
        state.error = null;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    builder
      .addCase(updateMembershipPets.pending, (state) => {
        state.isUpdatingPets = true;
        state.error = null;
      })
      .addCase(updateMembershipPets.fulfilled, (state, action) => {
        state.isUpdatingPets = false;
        if (state.userMembership) {
          state.userMembership.pet_ids = action.payload.pet_ids;
        }
        const memberIndex = state.currentGroupMembers.findIndex(
          member => member.user_id === state.userMembership?.user_id
        );
        if (memberIndex !== -1) {
          state.currentGroupMembers[memberIndex].pet_ids = action.payload.pet_ids;
        }
        state.error = null;
      })
      .addCase(updateMembershipPets.rejected, (state, action) => {
        state.isUpdatingPets = false;
        state.error = action.payload as ApiError;
      });

    // Decline invitation reducers
    builder
      .addCase(declineInvitation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(declineInvitation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the invitation from current invitations if it exists
        state.currentGroupInvitations = state.currentGroupInvitations.filter(
          invitation => invitation.id !== action.payload
        );
        state.error = null;
      })
      .addCase(declineInvitation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });

    // Dismiss invitation reducers
    builder
      .addCase(dismissInvitation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(dismissInvitation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the invitation from current invitations (local UI dismissal)
        state.currentGroupInvitations = state.currentGroupInvitations.filter(
          invitation => invitation.id !== action.payload
        );
        state.error = null;
      })
      .addCase(dismissInvitation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiError;
      });
  },
});

export const { clearError, clearCurrentGroup, resetGroupState } = groupSlice.actions;

// Selectors
export const selectCurrentGroup = (state: { groups: GroupState }) => state.groups.currentGroup;
export const selectGroupError = (state: { groups: GroupState }) => state.groups.error;
export const selectGroupLoading = (state: { groups: GroupState }) => state.groups.isLoading;

export default groupSlice.reducer;