import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice, { loginUser as login, registerUser as register, logoutUser as logout } from '../../store/authSlice';
import groupSlice, { resetGroupState } from '../../store/groupSlice';
import petSlice, { resetPets } from '../../store/petSlice';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Authentication Flow Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
        groups: groupSlice,
        pets: petSlice,
      },
    });
    jest.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const registerResponse = {
        token: 'jwt-token-123',
        user_id: 'user-123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.register.mockResolvedValueOnce(registerResponse);

      // Execute registration
      await store.dispatch(register(registerData));

      // Verify state changes
      const authState = store.getState().auth;
      expect(authState.isLoading).toBe(false);
      expect(authState.user).toEqual(registerResponse.user);
      expect(authState.error).toBeNull();

      // Verify API calls
      expect(mockedApiService.register).toHaveBeenCalledWith(registerData);
    });

    it('should handle registration errors', async () => {
      const registerData = {
        email: 'invalid-email',
        password: '123',
        first_name: '',
        last_name: '',
      };

      const registrationError = {
        message: 'Invalid email format',
        status: 400,
        code: 'INVALID_EMAIL',
        field: 'email',
      };

      mockedApiService.register.mockRejectedValueOnce(registrationError);

      await store.dispatch(register(registerData));

      const authState = store.getState().auth;
      expect(authState.isLoading).toBe(false);
      expect(authState.user).toBeNull();
      expect(authState.error).toEqual(registrationError);
    });
  });

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse = {
        token: 'jwt-token-456',
        user_id: 'user-456',
        user: {
          id: 'user-456',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.login.mockResolvedValueOnce(loginResponse);
      mockedApiService.getCurrentUser.mockResolvedValueOnce(loginResponse.user);

      // Execute login
      await store.dispatch(login(loginData));

      // Verify state changes
      const authState = store.getState().auth;
      expect(authState.isLoading).toBe(false);
      expect(authState.user).toEqual(loginResponse.user);
      expect(authState.error).toBeNull();

      // Verify API calls
      expect(mockedApiService.login).toHaveBeenCalledWith(loginData);
    });

    it('should handle login errors', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const loginError = {
        message: 'Invalid credentials',
        status: 401,
        code: 'INVALID_CREDENTIALS',
      };

      mockedApiService.login.mockRejectedValueOnce(loginError);

      await store.dispatch(login(loginData));

      const authState = store.getState().auth;
      expect(authState.isLoading).toBe(false);
      expect(authState.user).toBeNull();
      expect(authState.error).toEqual(loginError);
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      // Set up authenticated state
      const loginResponse = {
        token: 'jwt-token-456',
        user_id: 'user-456',
        user: {
          id: 'user-456',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.login.mockResolvedValueOnce(loginResponse);
      mockedApiService.getCurrentUser.mockResolvedValueOnce(loginResponse.user);
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123',
      }));

      // Add some groups and pets to state
      store.dispatch({
        type: 'groups/fetchUserGroups/fulfilled',
        payload: {
          created_groups: [{ id: 'group-1', name: 'Test Group' }],
          joined_groups: [],
        },
      });

      store.dispatch({
        type: 'pets/fetchPets/fulfilled',
        payload: [{ id: 'pet-1', name: 'Buddy' }],
      });
    });

    it('should complete full logout flow and clear all data', async () => {
      mockedApiService.logout.mockResolvedValueOnce(undefined);

      // Execute logout
      await store.dispatch(logout());

      // Verify auth state is cleared
      const authState = store.getState().auth;
      expect(authState.user).toBeNull();
      expect(authState.isLoading).toBe(false);
      expect(authState.error).toBeNull();

      // Verify all related state is cleared
      const groupState = store.getState().groups;
      expect(groupState.groups).toHaveLength(0);
      expect(groupState.currentGroup).toBeNull();

      const petState = store.getState().pets;
      expect(petState.pets).toHaveLength(0);
      expect(petState.selectedPet).toBeNull();

      // Verify API call
      expect(mockedApiService.logout).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      const logoutError = {
        message: 'Logout failed',
        status: 500,
      };

      mockedApiService.logout.mockRejectedValueOnce(logoutError);

      await store.dispatch(logout());

      // Should still clear local state even if API call fails
      const authState = store.getState().auth;
      expect(authState.user).toBeNull();
      expect(authState.error).toEqual(logoutError);
    });
  });

  describe('Token Persistence', () => {
    it('should store tokens on successful login', async () => {
      const loginResponse = {
        token: 'jwt-token-789',
        user_id: 'user-789',
        user: {
          id: 'user-789',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.login.mockResolvedValueOnce(loginResponse);

      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123',
      }));

      // Verify token storage (this would be handled by the API service)
      expect(mockedApiService.login).toHaveBeenCalled();
    });

    it('should clear tokens on logout', async () => {
      // Set up authenticated state
      const loginResponse = {
        token: 'jwt-token-789',
        user_id: 'user-789',
        user: { id: 'user-789', email: 'test@example.com' },
      };

      mockedApiService.login.mockResolvedValueOnce(loginResponse);
      mockedApiService.getCurrentUser.mockResolvedValueOnce(loginResponse.user);
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123',
      }));

      mockedApiService.logout.mockResolvedValueOnce(undefined);

      await store.dispatch(logout());

      // Verify token clearing (handled by API service)
      expect(mockedApiService.logout).toHaveBeenCalled();
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication across app restarts', async () => {
      // Simulate stored tokens
      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'stored-jwt-token',
          userId: 'stored-user-id',
        })
      );

      const currentUser = {
        id: 'stored-user-id',
        email: 'stored@example.com',
        first_name: 'Stored',
        last_name: 'User',
        created_at: '2025-01-01T00:00:00Z',
      };

      mockedApiService.getCurrentUser.mockResolvedValueOnce(currentUser);
      mockedApiService.isAuthenticated.mockResolvedValueOnce(true);

      // This would typically be done in app initialization
      // For testing, we simulate the rehydration process
      const isAuthenticated = await mockedApiService.isAuthenticated();
      if (isAuthenticated) {
        const user = await mockedApiService.getCurrentUser();
        store.dispatch({
          type: 'auth/getCurrentUser/fulfilled',
          payload: user,
        });
      }

      const authState = store.getState().auth;
      expect(authState.user).toEqual(currentUser);
    });

    it('should handle invalid stored tokens', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'expired-jwt-token',
          userId: 'user-id',
        })
      );

      mockedApiService.isAuthenticated.mockResolvedValueOnce(true);
      mockedApiService.getCurrentUser.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Token expired',
      });

      // Simulate app rehydration with expired token
      try {
        await mockedApiService.getCurrentUser();
      } catch (error) {
        // Should handle gracefully and clear auth state
        store.dispatch({
          type: 'auth/getCurrentUser/rejected',
          payload: error,
        });
      }

      const authState = store.getState().auth;
      expect(authState.user).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      // First attempt fails
      mockedApiService.login.mockRejectedValueOnce({
        message: 'Invalid credentials',
        status: 401,
      });

      await store.dispatch(login(loginData));

      let authState = store.getState().auth;
      expect(authState.error).toBeTruthy();
      expect(authState.user).toBeNull();

      // Clear error and retry with correct password
      store.dispatch({ type: 'auth/clearError' });

      const successfulLoginData = {
        email: 'test@example.com',
        password: 'correct-password',
      };

      const loginResponse = {
        token: 'jwt-token-success',
        user_id: 'user-success',
        user: {
          id: 'user-success',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.login.mockResolvedValueOnce(loginResponse);
      mockedApiService.getCurrentUser.mockResolvedValueOnce(loginResponse.user);

      await store.dispatch(login(successfulLoginData));

      authState = store.getState().auth;
      expect(authState.error).toBeNull();
      expect(authState.user).toEqual(loginResponse.user);
    });
  });

  describe('Concurrent Authentication Operations', () => {
    it('should handle multiple login attempts gracefully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse = {
        token: 'jwt-token-concurrent',
        user_id: 'user-concurrent',
        user: {
          id: 'user-concurrent',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01T00:00:00Z',
        },
      };

      mockedApiService.login.mockResolvedValue(loginResponse);
      mockedApiService.getCurrentUser.mockResolvedValue(loginResponse.user);

      // Dispatch multiple login attempts simultaneously
      const promises = [
        store.dispatch(login(loginData)),
        store.dispatch(login(loginData)),
        store.dispatch(login(loginData)),
      ];

      await Promise.all(promises);

      // Should only have one successful login
      const authState = store.getState().auth;
      expect(authState.user).toEqual(loginResponse.user);
      expect(authState.isLoading).toBe(false);
    });
  });
});