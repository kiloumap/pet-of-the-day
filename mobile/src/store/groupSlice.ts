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

interface GroupState {
  // Groups data
  groups: Group[];
  createdGroups: Group[];
  joinedGroups: { group: Group; membership: Membership }[];
  currentGroup: Group | null;
  currentGroupMembers: Membership[];
  currentGroupInvitations: Invitation[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isInviting: boolean;
  isUpdatingPets: boolean;

  // Error states
  error: ApiError | null;

  // UI states
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

// Async thunks
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
    // Fetch user groups
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

    // Create group
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
        state.error = null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as ApiError;
      });

    // Fetch group
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

    // Fetch group members
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

    // Join group
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

    // Leave group
    builder
      .addCase(leaveGroup.pending, (state) => {
        state.isLeaving = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.isLeaving = false;
        state.userMembership = null;
        // Remove from joined groups
        state.joinedGroups = state.joinedGroups.filter(
          jg => jg.group.id !== action.payload
        );
        // Remove from groups list
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

    // Invite to group
    builder
      .addCase(inviteToGroup.pending, (state) => {
        state.isInviting = true;
        state.error = null;
      })
      .addCase(inviteToGroup.fulfilled, (state, action) => {
        state.isInviting = false;
        // Add invitation to current group invitations if we're viewing the group
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

    // Accept invitation
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

    // Update group
    builder
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update current group if it matches
        if (state.currentGroup && state.currentGroup.id === action.payload.id) {
          state.currentGroup = {
            ...state.currentGroup,
            name: action.payload.name,
            description: action.payload.description,
            privacy: action.payload.privacy,
          };
        }
        // Update in created groups
        const createdIndex = state.createdGroups.findIndex(g => g.id === action.payload.id);
        if (createdIndex !== -1) {
          state.createdGroups[createdIndex] = {
            ...state.createdGroups[createdIndex],
            name: action.payload.name,
            description: action.payload.description,
            privacy: action.payload.privacy,
          };
        }
        // Update in joined groups
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

    // Delete group
    builder
      .addCase(deleteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const groupId = action.payload;
        // Remove from created groups
        state.createdGroups = state.createdGroups.filter(g => g.id !== groupId);
        // Remove from joined groups
        state.joinedGroups = state.joinedGroups.filter(jg => jg.group.id !== groupId);
        // Clear current group if it matches
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

    // Update membership pets
    builder
      .addCase(updateMembershipPets.pending, (state) => {
        state.isUpdatingPets = true;
        state.error = null;
      })
      .addCase(updateMembershipPets.fulfilled, (state, action) => {
        state.isUpdatingPets = false;
        // Update user membership pet_ids
        if (state.userMembership) {
          state.userMembership.pet_ids = action.payload.pet_ids;
        }
        // Update in current group members if applicable
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
  },
});

export const { clearError, clearCurrentGroup, resetGroupState } = groupSlice.actions;
export default groupSlice.reducer;