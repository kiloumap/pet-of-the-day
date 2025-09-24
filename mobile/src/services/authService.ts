import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  AuthTokens,
} from '../types/api';

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'auth_user';

export class AuthService {
  private currentUser: User | null = null;

  // Token management
  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const tokens = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.warn('Failed to get stored tokens:', error);
      return null;
    }
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.warn('Failed to store tokens:', error);
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      this.currentUser = null;
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  // User data management
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const user = userData ? JSON.parse(userData) : null;
      this.currentUser = user;
      return user;
    } catch (error) {
      console.warn('Failed to get stored user:', error);
      return null;
    }
  }

  async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      this.currentUser = user;
    } catch (error) {
      console.warn('Failed to store user:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Authentication methods
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.register(data);

      // Store tokens and user data
      await this.storeTokens({
        accessToken: response.token,
        userId: response.user_id,
      });

      // Fetch and store complete user profile
      const userProfile = await apiService.getCurrentUser();
      await this.storeUser(userProfile);

      return response;
    } catch (error) {
      // Clear any partial data on registration failure
      await this.clearTokens();
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.login(data);

      // Store tokens and user data
      await this.storeTokens({
        accessToken: response.token,
        userId: response.user_id,
      });

      // Fetch and store complete user profile
      const userProfile = await apiService.getCurrentUser();
      await this.storeUser(userProfile);

      return response;
    } catch (error) {
      // Clear any partial data on login failure
      await this.clearTokens();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call API logout endpoint if needed
      await apiService.logout();
    } catch (error) {
      console.warn('API logout failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage
      await this.clearTokens();
    }
  }

  async refreshUserProfile(): Promise<User> {
    try {
      const userProfile = await apiService.getCurrentUser();
      await this.storeUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  }

  // Authentication status
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return !!tokens?.accessToken;
  }

  async getAuthenticatedUserId(): Promise<string | null> {
    const tokens = await this.getStoredTokens();
    return tokens?.userId || null;
  }

  // Initialize auth state (call on app start)
  async initializeAuth(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
      const [tokens, user] = await Promise.all([
        this.getStoredTokens(),
        this.getStoredUser(),
      ]);

      const isAuthenticated = !!tokens?.accessToken;

      if (isAuthenticated && user) {
        this.currentUser = user;
        return { isAuthenticated: true, user };
      } else if (isAuthenticated && !user) {
        // Tokens exist but no user data, try to fetch user
        try {
          const userProfile = await apiService.getCurrentUser();
          await this.storeUser(userProfile);
          return { isAuthenticated: true, user: userProfile };
        } catch (error) {
          // Token is invalid, clear storage
          await this.clearTokens();
          return { isAuthenticated: false, user: null };
        }
      } else {
        return { isAuthenticated: false, user: null };
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.clearTokens();
      return { isAuthenticated: false, user: null };
    }
  }

  // Password reset (if implemented in backend)
  async requestPasswordReset(email: string): Promise<void> {
    // This would call a password reset endpoint
    // For now, it's a placeholder
    console.log('Password reset requested for:', email);
    throw new Error('Password reset not implemented yet');
  }

  // Update profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      // This would call an update profile endpoint
      // For now, we'll just update locally
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const updatedUser = { ...this.currentUser, ...updates };
      await this.storeUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Check if tokens are about to expire and refresh if needed
  async checkAndRefreshTokens(): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens?.accessToken) {
        return false;
      }

      // In a real implementation, you would check token expiration
      // and refresh if necessary. For now, we'll just return true
      // if tokens exist.

      return true;
    } catch (error) {
      console.error('Failed to check/refresh tokens:', error);
      await this.clearTokens();
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;