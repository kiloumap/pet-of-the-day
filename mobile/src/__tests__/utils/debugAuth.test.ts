import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugAuthState } from '../../utils/debugAuth';
import apiService from '../../services/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// Mock API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    isAuthenticated: jest.fn(),
    getStoredUserId: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock console methods
let consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('debugAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console spies
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('debugAuthState', () => {
    it('should debug auth state with valid tokens', async () => {
      const mockTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token',
        userId: 'user-123'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTokens));
      (apiService.isAuthenticated as jest.Mock).mockResolvedValueOnce(true);
      (apiService.getStoredUserId as jest.Mock).mockResolvedValueOnce('user-123');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      await debugAuthState();

      // Check that debug output was logged
      expect(consoleSpy.log).toHaveBeenCalledWith('🔍 AUTH DEBUG START');
      expect(consoleSpy.log).toHaveBeenCalledWith('📱 AsyncStorage raw data:', JSON.stringify(mockTokens));
    });

    it('should debug auth state with no tokens', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (apiService.isAuthenticated as jest.Mock).mockResolvedValueOnce(false);
      (apiService.getStoredUserId as jest.Mock).mockResolvedValueOnce(null);
      (apiService.getCurrentUser as jest.Mock).mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Unauthorized'
      });

      await debugAuthState();

      expect(consoleSpy.log).toHaveBeenCalledWith('📱 AsyncStorage raw data:', null);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('AsyncStorage error'));
      (apiService.isAuthenticated as jest.Mock).mockResolvedValueOnce(false);
      (apiService.getStoredUserId as jest.Mock).mockResolvedValueOnce(null);

      await debugAuthState();

      // Function should handle error and continue
      expect(consoleSpy.log).toHaveBeenCalledWith('🔍 AUTH DEBUG START');
    });
  });

  describe('integration with auth flow', () => {
    it('should provide useful debugging for login flow', async () => {
      // Simulate fresh app state - no tokens
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (apiService.isAuthenticated as jest.Mock).mockResolvedValueOnce(false);
      (apiService.getStoredUserId as jest.Mock).mockResolvedValueOnce(null);
      (apiService.getCurrentUser as jest.Mock).mockRejectedValueOnce({
        response: { status: 401 },
        message: 'No authorization header'
      });

      await debugAuthState();

      // Should clearly show unauthenticated state
      expect(consoleSpy.log).toHaveBeenCalledWith('📱 AsyncStorage raw data:', null);
    });

    it('should provide useful debugging for authenticated state', async () => {
      // Simulate authenticated user
      const mockTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token',
        userId: 'user-123'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTokens));
      (apiService.isAuthenticated as jest.Mock).mockResolvedValueOnce(true);
      (apiService.getStoredUserId as jest.Mock).mockResolvedValueOnce('user-123');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      await debugAuthState();

      // Should show authenticated state
      expect(consoleSpy.log).toHaveBeenCalledWith('📱 AsyncStorage raw data:', JSON.stringify(mockTokens));
    });
  });
});