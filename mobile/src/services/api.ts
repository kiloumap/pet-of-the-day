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
  GetPetsResponse,
  Pet,
  AuthTokens,
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
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
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
      return {
        message: error.response.data?.message || error.response.data || 'An error occurred',
        status: error.response.status,
        code: error.response.data?.code,
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
    const response: AxiosResponse<RegisterResponse> = await this.client.post('/api/auth/register', data);

    // Store tokens after successful registration
    await this.storeTokens({
      accessToken: response.data.token,
      userId: response.data.user_id,
    });

    return response.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.client.post('/api/auth/login', data);

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
    const response: AxiosResponse<AddPetResponse> = await this.client.post('/api/pets', data);
    return response.data;
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
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;