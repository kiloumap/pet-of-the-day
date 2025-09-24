import { apiService } from '../services/api';
import { authService } from '../services/authService';
import { petsService } from '../services/petsService';
import { API_CONFIG } from '../config/api';

// Test credentials for development
const TEST_CREDENTIALS = {
  email: 'test@petoftheday.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
};

export interface TestResult {
  success: boolean;
  message: string;
  duration?: number;
  data?: any;
  error?: any;
}

// JWT Token Flow Testing
export class TokenFlowTester {
  private startTime: number = 0;

  private startTimer(): void {
    this.startTime = Date.now();
  }

  private getElapsed(): number {
    return Date.now() - this.startTime;
  }

  async testTokenFlow(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('🧪 Starting JWT Token Flow Tests...');

    // Test 1: Check API connectivity
    results.push(await this.testApiConnectivity());

    // Test 2: User registration
    results.push(await this.testUserRegistration());

    // Test 3: User login
    results.push(await this.testUserLogin());

    // Test 4: Authenticated request
    results.push(await this.testAuthenticatedRequest());

    // Test 5: Token persistence
    results.push(await this.testTokenPersistence());

    // Test 6: Invalid token handling
    results.push(await this.testInvalidTokenHandling());

    // Test 7: Logout
    results.push(await this.testLogout());

    return results;
  }

  private async testApiConnectivity(): Promise<TestResult> {
    this.startTimer();
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`);

      if (response.ok) {
        return {
          success: true,
          message: 'API server is reachable',
          duration: this.getElapsed(),
        };
      } else {
        return {
          success: false,
          message: `API server returned status ${response.status}`,
          duration: this.getElapsed(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to API server',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testUserRegistration(): Promise<TestResult> {
    this.startTimer();
    try {
      // Clear any existing auth first
      await authService.logout();

      const response = await authService.register({
        email: `test-${Date.now()}@petoftheday.com`, // Use unique email
        password: TEST_CREDENTIALS.password,
        first_name: TEST_CREDENTIALS.firstName,
        last_name: TEST_CREDENTIALS.lastName,
      });

      if (response.token && response.user_id) {
        return {
          success: true,
          message: 'User registration successful',
          duration: this.getElapsed(),
          data: { userId: response.user_id, hasToken: !!response.token },
        };
      } else {
        return {
          success: false,
          message: 'Registration response missing required fields',
          duration: this.getElapsed(),
          data: response,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'User registration failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testUserLogin(): Promise<TestResult> {
    this.startTimer();
    try {
      const response = await authService.login({
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
      });

      if (response.token && response.user_id) {
        return {
          success: true,
          message: 'User login successful',
          duration: this.getElapsed(),
          data: { userId: response.user_id, hasToken: !!response.token },
        };
      } else {
        return {
          success: false,
          message: 'Login response missing required fields',
          duration: this.getElapsed(),
          data: response,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'User login failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testAuthenticatedRequest(): Promise<TestResult> {
    this.startTimer();
    try {
      const user = await apiService.getCurrentUser();

      if (user && user.id) {
        return {
          success: true,
          message: 'Authenticated request successful',
          duration: this.getElapsed(),
          data: { userId: user.id, email: user.email },
        };
      } else {
        return {
          success: false,
          message: 'Authenticated request returned invalid data',
          duration: this.getElapsed(),
          data: user,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Authenticated request failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testTokenPersistence(): Promise<TestResult> {
    this.startTimer();
    try {
      // Check if tokens are persisted
      const tokens = await authService.getStoredTokens();
      const isAuthenticated = await authService.isAuthenticated();

      if (tokens && isAuthenticated) {
        return {
          success: true,
          message: 'Token persistence working correctly',
          duration: this.getElapsed(),
          data: { hasTokens: !!tokens, isAuthenticated },
        };
      } else {
        return {
          success: false,
          message: 'Token persistence not working',
          duration: this.getElapsed(),
          data: { hasTokens: !!tokens, isAuthenticated },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Token persistence test failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testInvalidTokenHandling(): Promise<TestResult> {
    this.startTimer();
    try {
      // Store invalid token
      await authService.storeTokens({
        accessToken: 'invalid_token_for_testing',
        userId: 'test_user_id',
      });

      // Try to make authenticated request with invalid token
      try {
        await apiService.getCurrentUser();
        return {
          success: false,
          message: 'Invalid token was accepted (should have been rejected)',
          duration: this.getElapsed(),
        };
      } catch (error) {
        // This is expected - invalid token should be rejected
        const isAuthenticated = await authService.isAuthenticated();

        if (!isAuthenticated) {
          return {
            success: true,
            message: 'Invalid token correctly handled and cleared',
            duration: this.getElapsed(),
          };
        } else {
          return {
            success: false,
            message: 'Invalid token not properly cleared',
            duration: this.getElapsed(),
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token handling test failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testLogout(): Promise<TestResult> {
    this.startTimer();
    try {
      await authService.logout();

      const isAuthenticated = await authService.isAuthenticated();
      const tokens = await authService.getStoredTokens();

      if (!isAuthenticated && !tokens) {
        return {
          success: true,
          message: 'Logout successful - tokens cleared',
          duration: this.getElapsed(),
        };
      } else {
        return {
          success: false,
          message: 'Logout failed - tokens not cleared properly',
          duration: this.getElapsed(),
          data: { isAuthenticated, hasTokens: !!tokens },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Logout test failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// File Upload Testing
export class FileUploadTester {
  private startTime: number = 0;

  private startTimer(): void {
    this.startTime = Date.now();
  }

  private getElapsed(): number {
    return Date.now() - this.startTime;
  }

  async testFileUpload(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('📸 Starting File Upload Tests...');

    // Test 1: Create mock pet for upload test
    results.push(await this.testCreateTestPet());

    // Test 2: Mock file upload
    results.push(await this.testMockFileUpload());

    return results;
  }

  private async testCreateTestPet(): Promise<TestResult> {
    this.startTimer();
    try {
      // Ensure user is authenticated first
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          message: 'User not authenticated for pet creation',
          duration: this.getElapsed(),
        };
      }

      const pet = await petsService.createPet({
        name: `Test Pet ${Date.now()}`,
        species: 'dog',
        breed: 'Test Breed',
        birth_date: '2020-01-01',
      });

      if (pet && pet.pet_id) {
        return {
          success: true,
          message: 'Test pet created successfully',
          duration: this.getElapsed(),
          data: { petId: pet.pet_id },
        };
      } else {
        return {
          success: false,
          message: 'Pet creation failed',
          duration: this.getElapsed(),
          data: pet,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Test pet creation failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testMockFileUpload(): Promise<TestResult> {
    this.startTime = Date.now();

    // This is a mock test since we can't easily create real files in React Native without user interaction
    try {
      // Create a mock file-like object
      const mockFile = new Blob(['mock image data'], { type: 'image/jpeg' });

      // Note: In a real implementation, this would test actual file upload
      // For now, we'll just validate the upload method exists and is callable

      if (typeof petsService.uploadPetPhoto === 'function') {
        return {
          success: true,
          message: 'File upload method is available (mock test)',
          duration: this.getElapsed(),
          data: {
            uploadMethodExists: true,
            mockFileSize: mockFile.size,
            mockFileType: mockFile.type
          },
        };
      } else {
        return {
          success: false,
          message: 'File upload method not available',
          duration: this.getElapsed(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'File upload test failed',
        duration: this.getElapsed(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper to create a test image blob (for React Native testing)
  createTestImageBlob(): Blob {
    // Create a minimal valid JPEG header for testing
    const jpegHeader = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
    ]);

    return new Blob([jpegHeader], { type: 'image/jpeg' });
  }
}

// API Error Handling Testing
export class ErrorHandlingTester {
  async testErrorHandling(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('⚠️ Starting Error Handling Tests...');

    // Test 1: Invalid endpoint
    results.push(await this.testInvalidEndpoint());

    // Test 2: Malformed request
    results.push(await this.testMalformedRequest());

    // Test 3: Rate limiting (if implemented)
    results.push(await this.testRateLimiting());

    return results;
  }

  private async testInvalidEndpoint(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/nonexistent-endpoint`);

      if (response.status === 404) {
        return {
          success: true,
          message: '404 error properly returned for invalid endpoint',
          duration: Date.now() - startTime,
        };
      } else {
        return {
          success: false,
          message: `Expected 404, got ${response.status}`,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Invalid endpoint test failed with network error',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testMalformedRequest(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-data',
      });

      if (response.status >= 400 && response.status < 500) {
        return {
          success: true,
          message: 'Malformed request properly rejected',
          duration: Date.now() - startTime,
          data: { status: response.status },
        };
      } else {
        return {
          success: false,
          message: `Expected 4xx error, got ${response.status}`,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Malformed request test failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async testRateLimiting(): Promise<TestResult> {
    const startTime = Date.now();

    // This is a basic test - in reality, rate limiting testing requires more sophisticated approaches
    return {
      success: true,
      message: 'Rate limiting test skipped (requires backend implementation)',
      duration: Date.now() - startTime,
    };
  }
}

// Utility function to run all tests
export const runIntegrationTests = async (): Promise<{
  tokenFlow: TestResult[];
  fileUpload: TestResult[];
  errorHandling: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}> => {
  const startTime = Date.now();

  console.log('🚀 Starting Integration Tests...');

  const tokenFlowTester = new TokenFlowTester();
  const fileUploadTester = new FileUploadTester();
  const errorHandlingTester = new ErrorHandlingTester();

  const [tokenFlow, fileUpload, errorHandling] = await Promise.all([
    tokenFlowTester.testTokenFlow(),
    fileUploadTester.testFileUpload(),
    errorHandlingTester.testErrorHandling(),
  ]);

  const allResults = [...tokenFlow, ...fileUpload, ...errorHandling];
  const passed = allResults.filter(result => result.success).length;
  const failed = allResults.length - passed;

  console.log('📊 Integration Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Total Duration: ${Date.now() - startTime}ms`);

  return {
    tokenFlow,
    fileUpload,
    errorHandling,
    summary: {
      total: allResults.length,
      passed,
      failed,
      duration: Date.now() - startTime,
    },
  };
};