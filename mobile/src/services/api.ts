import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import {
  ApiError,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  User,
  AddPetRequest,
  AddPetResponse,
  UpdatePetRequest,
  UpdatePetResponse,
  GetPetsResponse,
  Pet,
  AuthTokens,
  CreateGroupRequest,
  CreateGroupResponse,
  UpdateGroupRequest,
  UpdateGroupResponse,
  JoinGroupRequest,
  JoinGroupResponse,
  GetUserGroupsResponse,
  GetGroupResponse,
  GetGroupMembersResponse,
  AcceptInvitationRequest,
  InviteToGroupRequest,
  InviteToGroupResponse,
  Behavior,
  ScoreEvent,
  CreateScoreEventRequest,
  CreateScoreEventResponse,
  GetBehaviorsResponse,
  GetPetScoreEventsResponse,
  GetLeaderboardResponse,
  GetRecentActivitiesResponse,
  UpdateMembershipPetsRequest,
} from '../types/api';

const TOKEN_STORAGE_KEY = 'auth_tokens';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      const tokens = await this.getStoredTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        if (__DEV__) {
          console.log('🔑 Adding auth token to request:', config.url);
        }
      } else {
        if (__DEV__) {
          console.warn('⚠️  No auth token found for request:', config.url);
        }
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (__DEV__) {
          console.error('🚨 API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            request: error.request,
            message: error.message,
          });
        }
        if (error.response?.status === 401) {
          // Token expired or invalid, clear stored tokens
          await this.clearTokens();
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): ApiError {
    if (error.response) {
      const responseData = error.response.data;

      // Handle new standardized error format
      if (responseData && typeof responseData === 'object') {
        // Single API error with code
        if (responseData.code && responseData.message) {
          return {
            message: responseData.message,
            status: error.response.status,
            code: responseData.code,
            field: responseData.field,
          };
        }

        // Validation errors with multiple fields
        if (responseData.errors && Array.isArray(responseData.errors)) {
          // Return the first validation error for backward compatibility
          const firstError = responseData.errors[0];
          return {
            message: firstError.message,
            status: error.response.status,
            code: firstError.code,
            field: firstError.field,
            validationErrors: responseData.errors,
          };
        }

        // Fallback to message field
        if (responseData.message) {
          return {
            message: responseData.message,
            status: error.response.status,
            code: responseData.code,
          };
        }
      }

      // Fallback for old string responses
      return {
        message: typeof responseData === 'string' ? responseData : 'An error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  }

  // Token management
  private async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const tokens = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.warn('Failed to get stored tokens:', error);
      return null;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.warn('Failed to store tokens:', error);
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Convert snake_case to PascalCase for backend
    const backendData = {
      Email: data.email,
      Password: data.password,
      FirstName: data.first_name,
      LastName: data.last_name,
    };

    const response: AxiosResponse<RegisterResponse> = await this.client.post('/api/auth/register', backendData);

    // Store tokens after successful registration
    await this.storeTokens({
      accessToken: response.data.token,
      userId: response.data.user_id,
    });

    return response.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    // Convert snake_case to PascalCase for backend
    const backendData = {
      Email: data.email,
      Password: data.password,
    };

    const response: AxiosResponse<LoginResponse> = await this.client.post('/api/auth/login', backendData);

    // Store tokens after successful login
    await this.storeTokens({
      accessToken: response.data.token,
      userId: response.data.user_id,
    });

    return response.data;
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/api/users/me');
    return response.data;
  }

  // Pet methods
  async getPets(): Promise<GetPetsResponse> {
    const response: AxiosResponse<GetPetsResponse> = await this.client.get('/api/pets');
    return response.data;
  }

  async getPetById(id: string): Promise<Pet> {
    const response: AxiosResponse<Pet> = await this.client.get(`/api/pets/${id}`);
    return response.data;
  }

  async addPet(data: AddPetRequest): Promise<AddPetResponse> {
    // Convert snake_case to PascalCase for backend
    const backendData = {
      Name: data.name,
      Species: data.species,
      Breed: data.breed,
      BirthDate: data.birth_date,
      PhotoUrl: data.photo_url,
    };

    const response: AxiosResponse<AddPetResponse> = await this.client.post('/api/pets', backendData);
    return response.data;
  }

  async updatePet(data: UpdatePetRequest): Promise<UpdatePetResponse> {
    const { petId, ...updateData } = data;
    const response: AxiosResponse<UpdatePetResponse> = await this.client.put(`/api/pets/${petId}`, updateData);
    return response.data;
  }

  async deletePet(petId: string): Promise<void> {
    await this.client.delete(`/api/pets/${petId}`);
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return !!tokens?.accessToken;
  }

  async getStoredUserId(): Promise<string | null> {
    const tokens = await this.getStoredTokens();
    return tokens?.userId || null;
  }

  // Group methods
  async createGroup(data: CreateGroupRequest): Promise<CreateGroupResponse> {
    const response: AxiosResponse<CreateGroupResponse> = await this.client.post('/api/groups', data);
    return response.data;
  }

  async getUserGroups(userId: string): Promise<GetUserGroupsResponse> {
    const response: AxiosResponse<GetUserGroupsResponse> = await this.client.get(`/api/users/${userId}/groups`);
    return response.data;
  }

  async getGroup(groupId: string): Promise<GetGroupResponse> {
    const response: AxiosResponse<GetGroupResponse> = await this.client.get(`/api/groups/${groupId}`);
    return response.data;
  }

  async getGroupMembers(groupId: string): Promise<GetGroupMembersResponse> {
    const response: AxiosResponse<GetGroupMembersResponse> = await this.client.get(`/api/groups/${groupId}/members`);
    return response.data;
  }

  async joinGroup(groupId: string, data: JoinGroupRequest): Promise<JoinGroupResponse> {
    const response: AxiosResponse<JoinGroupResponse> = await this.client.post(`/api/groups/${groupId}/join`, data);
    return response.data;
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.client.post(`/api/groups/${groupId}/leave`);
  }

  async updateGroup(data: UpdateGroupRequest): Promise<UpdateGroupResponse> {
    const { groupId, ...updateData } = data;
    const response: AxiosResponse<UpdateGroupResponse> = await this.client.put(`/api/groups/${groupId}`, updateData);
    return response.data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.client.delete(`/api/groups/${groupId}`);
  }

  async inviteToGroup(groupId: string, data: InviteToGroupRequest): Promise<InviteToGroupResponse> {
    const response: AxiosResponse<InviteToGroupResponse> = await this.client.post(`/api/groups/${groupId}/invite`, data);
    return response.data;
  }

  async acceptInvitation(data: AcceptInvitationRequest): Promise<JoinGroupResponse> {
    const response: AxiosResponse<JoinGroupResponse> = await this.client.post('/api/invitations/accept', data);
    return response.data;
  }

  // Points system methods
  async getBehaviors(species?: 'dog' | 'cat'): Promise<GetBehaviorsResponse> {
    const params = species ? { species } : {};
    const response: AxiosResponse<GetBehaviorsResponse> = await this.client.get('/api/behaviors', { params });
    return response.data;
  }

  async createScoreEvent(data: CreateScoreEventRequest): Promise<CreateScoreEventResponse> {
    const response: AxiosResponse<CreateScoreEventResponse> = await this.client.post('/api/score-events', data);
    return response.data;
  }

  async getPetScoreEvents(petId: string, groupId: string, limit = 50): Promise<GetPetScoreEventsResponse> {
    const response: AxiosResponse<GetPetScoreEventsResponse> = await this.client.get(
      `/api/pets/${petId}/score-events`,
      { params: { group_id: groupId, limit } }
    );
    return response.data;
  }

  async getGroupLeaderboard(groupId: string, period: 'daily' | 'weekly' = 'daily'): Promise<GetLeaderboardResponse> {
    const response: AxiosResponse<GetLeaderboardResponse> = await this.client.get(
      `/api/groups/${groupId}/leaderboard`,
      { params: { period } }
    );
    return response.data;
  }

  async deleteScoreEvent(eventId: string): Promise<void> {
    await this.client.delete(`/api/score-events/${eventId}`);
  }

  async getRecentActivities(limit = 20): Promise<GetRecentActivitiesResponse> {
    const response: AxiosResponse<GetRecentActivitiesResponse> = await this.client.get(
      '/api/activities/recent',
      { params: { limit } }
    );
    return response.data;
  }

  async updateMembershipPets(data: UpdateMembershipPetsRequest): Promise<void> {
    const { groupId, ...updateData } = data;
    await this.client.put(`/api/groups/${groupId}/pets`, updateData);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;