import { configureStore } from '@reduxjs/toolkit';
import groupSlice, {
  fetchUserGroups,
  createGroup,
  fetchGroup,
  fetchGroupMembers,
  joinGroup,
  leaveGroup,
  clearError,
  clearCurrentGroup,
  resetGroupState,
} from '../../store/groupSlice';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('Group Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        groups: groupSlice,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().groups;
      expect(state).toEqual({
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
      });
    });
  });

  describe('fetchUserGroups', () => {
    it('should handle successful user groups fetch', async () => {
      const mockResponse = {
        created_groups: [
          { id: 'group-1', name: 'My Group', creator_id: 'user-1' }
        ],
        joined_groups: [
          {
            group: { id: 'group-2', name: 'Joined Group', creator_id: 'user-2' },
            membership: { id: 'member-1', user_id: 'user-1', pet_ids: ['pet-1'] }
          }
        ]
      };

      mockedApiService.getUserGroups.mockResolvedValueOnce(mockResponse);

      await store.dispatch(fetchUserGroups('user-1'));

      const state = store.getState().groups;
      expect(state.isLoading).toBe(false);
      expect(state.createdGroups).toHaveLength(1);
      expect(state.joinedGroups).toHaveLength(1);
      expect(state.groups).toHaveLength(2); // Combined created + joined
      expect(state.error).toBeNull();
    });

    it('should handle failed user groups fetch', async () => {
      const mockError = {
        message: 'Failed to fetch groups',
        status: 500
      };

      mockedApiService.getUserGroups.mockRejectedValueOnce(mockError);

      await store.dispatch(fetchUserGroups('user-1'));

      const state = store.getState().groups;
      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(mockError);
    });

    it('should set loading state during fetch', () => {
      const mockResponse = {
        created_groups: [],
        joined_groups: []
      };

      mockedApiService.getUserGroups.mockResolvedValueOnce(mockResponse);

      const promise = store.dispatch(fetchUserGroups('user-1'));

      const state = store.getState().groups;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();

      return promise;
    });
  });

  describe('createGroup', () => {
    it('should handle successful group creation with auto-membership', async () => {
      const mockResponse = {
        id: 'new-group-id',
        name: 'New Group',
        description: 'Test group',
        privacy: 'private',
        creator_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        membership: {
          id: 'membership-1',
          group_id: 'new-group-id',
          user_id: 'user-1',
          pet_ids: ['pet-1'],
          status: 'active',
          created_at: '2025-01-01T00:00:00Z'
        }
      };

      mockedApiService.createGroup.mockResolvedValueOnce(mockResponse);

      const groupData = {
        name: 'New Group',
        description: 'Test group',
        privacy: 'private' as 'private' | 'public'
      };

      await store.dispatch(createGroup(groupData));

      const state = store.getState().groups;
      expect(state.isCreating).toBe(false);
      expect(state.createdGroups).toHaveLength(1);
      expect(state.joinedGroups).toHaveLength(1); // Auto-joined as creator
      expect(state.groups).toHaveLength(1);
      expect(state.error).toBeNull();

      const newGroup = state.createdGroups[0];
      expect(newGroup.name).toBe('New Group');
      expect(newGroup.id).toBe('new-group-id');

      const joinedGroup = state.joinedGroups[0];
      expect(joinedGroup.membership.user_id).toBe('user-1');
      expect(joinedGroup.membership.status).toBe('active');
    });

    it('should handle group creation without membership', async () => {
      const mockResponse = {
        id: 'new-group-id',
        name: 'New Group',
        description: 'Test group',
        privacy: 'private',
        creator_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z'
        // No membership field
      };

      mockedApiService.createGroup.mockResolvedValueOnce(mockResponse);

      const groupData = {
        name: 'New Group',
        description: 'Test group',
        privacy: 'private' as 'private' | 'public'
      };

      await store.dispatch(createGroup(groupData));

      const state = store.getState().groups;
      expect(state.createdGroups).toHaveLength(1);
      expect(state.joinedGroups).toHaveLength(0); // No auto-join
    });
  });

  describe('fetchGroupMembers', () => {
    it('should handle successful group members fetch', async () => {
      const mockResponse = {
        members: [
          { id: 'member-1', user_id: 'user-1', pet_ids: ['pet-1'], status: 'active' },
          { id: 'member-2', user_id: 'user-2', pet_ids: ['pet-2'], status: 'active' }
        ],
        invitations: [
          { id: 'inv-1', invite_type: 'email', status: 'pending' }
        ]
      };

      mockedApiService.getGroupMembers.mockResolvedValueOnce(mockResponse);

      await store.dispatch(fetchGroupMembers('group-1'));

      const state = store.getState().groups;
      expect(state.isLoading).toBe(false);
      expect(state.currentGroupMembers).toHaveLength(2);
      expect(state.currentGroupInvitations).toHaveLength(1);
      expect(state.error).toBeNull();
    });
  });

  describe('joinGroup', () => {
    it('should handle successful group join', async () => {
      const mockResponse = {
        id: 'membership-1',
        group_id: 'group-1',
        user_id: 'user-1',
        pet_ids: ['pet-1'],
        status: 'active'
      };

      mockedApiService.joinGroup.mockResolvedValueOnce(mockResponse);

      const joinData = {
        groupId: 'group-1',
        data: { pet_ids: ['pet-1'] }
      };

      await store.dispatch(joinGroup(joinData));

      const state = store.getState().groups;
      expect(state.isJoining).toBe(false);
      expect(state.userMembership).toBeTruthy();
      expect(state.userMembership?.group_id).toBe('group-1');
      expect(state.error).toBeNull();
    });
  });

  describe('leaveGroup', () => {
    it('should handle successful group leave', async () => {
      // Set up initial state with membership
      store.dispatch({
        type: 'groups/fetchUserGroups/fulfilled',
        payload: {
          created_groups: [],
          joined_groups: [
            {
              group: { id: 'group-1', name: 'Test Group' },
              membership: { id: 'member-1', user_id: 'user-1' }
            }
          ]
        }
      });

      mockedApiService.leaveGroup.mockResolvedValueOnce(undefined);

      await store.dispatch(leaveGroup('group-1'));

      const state = store.getState().groups;
      expect(state.isLeaving).toBe(false);
      expect(state.userMembership).toBeNull();
      expect(state.joinedGroups).toHaveLength(0);
      expect(state.error).toBeNull();
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set initial error
      store.dispatch({
        type: 'groups/fetchUserGroups/rejected',
        payload: { message: 'Test error' }
      });

      store.dispatch(clearError());

      const state = store.getState().groups;
      expect(state.error).toBeNull();
    });

    it('should clear current group', () => {
      // Set initial group data
      store.dispatch({
        type: 'groups/fetchGroup/fulfilled',
        payload: {
          group: { id: 'group-1', name: 'Test Group' },
          is_creator: true,
          membership: { id: 'member-1' }
        }
      });

      store.dispatch(clearCurrentGroup());

      const state = store.getState().groups;
      expect(state.currentGroup).toBeNull();
      expect(state.currentGroupMembers).toHaveLength(0);
      expect(state.currentGroupInvitations).toHaveLength(0);
      expect(state.isCreator).toBe(false);
      expect(state.userMembership).toBeNull();
    });

    it('should reset group state', () => {
      // Set some state
      store.dispatch({
        type: 'groups/fetchUserGroups/fulfilled',
        payload: {
          created_groups: [{ id: 'group-1' }],
          joined_groups: []
        }
      });

      store.dispatch(resetGroupState());

      const state = store.getState().groups;
      expect(state.groups).toHaveLength(0);
      expect(state.createdGroups).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle API errors correctly', async () => {
      const mockError = {
        message: 'Network error',
        status: 500,
        code: 'NETWORK_ERROR'
      };

      mockedApiService.createGroup.mockRejectedValueOnce(mockError);

      const groupData = {
        name: 'Test Group',
        description: 'Test',
        privacy: 'private' as 'private' | 'public'
      };

      await store.dispatch(createGroup(groupData));

      const state = store.getState().groups;
      expect(state.isCreating).toBe(false);
      expect(state.error).toEqual(mockError);
    });
  });
});