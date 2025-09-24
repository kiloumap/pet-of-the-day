import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Environment configuration
export const ENV = {
  DEVELOPMENT: 'DEVELOPMENT',
  STAGING: 'STAGING',
  PRODUCTION: 'PRODUCTION',
} as const;

type EnvironmentType = typeof ENV[keyof typeof ENV];

// Get current environment
export const getCurrentEnvironment = (): EnvironmentType => {
  if (__DEV__) {
    return ENV.DEVELOPMENT;
  }

  // Check if we're in Expo Go or standalone build
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;

  if (releaseChannel === 'staging') {
    return ENV.STAGING;
  }

  if (releaseChannel === 'production') {
    return ENV.PRODUCTION;
  }

  // Default to development for Expo Go
  return ENV.DEVELOPMENT;
};

// Smart API URL detection
const getApiUrl = (): string => {
  const currentEnv = getCurrentEnvironment();

  // Environment-specific URLs
  const envUrls = {
    [ENV.DEVELOPMENT]: (() => {
      // Check for environment variable first
      if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
      }

      // Auto-detect development server URL
      const expoConfig = Constants.expoConfig;
      if (expoConfig?.hostUri) {
        const host = expoConfig.hostUri.split(':')[0];
        return `http://${host}:8080`;
      }

      // Fallback to manifest for older versions
      if (Constants.manifest?.debuggerHost) {
        const debuggerHost = Constants.manifest.debuggerHost.split(':').shift();
        return `http://${debuggerHost}:8080`;
      }

      // Platform-specific fallbacks
      if (Platform.OS === 'ios') {
        return 'http://localhost:8080';
      } else if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8080';
      }
      return 'http://localhost:8080';
    })(),
    [ENV.STAGING]: 'https://staging-api.petoftheday.com',
    [ENV.PRODUCTION]: 'https://api.petoftheday.com',
  };

  return envUrls[currentEnv] || envUrls[ENV.DEVELOPMENT];
};

// Environment-specific configurations
const getApiConfig = () => {
  const currentEnv = getCurrentEnvironment();

  const baseConfig = {
    BASE_URL: getApiUrl(),
    TIMEOUT: currentEnv === ENV.PRODUCTION ? 10000 : 15000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  };

  if (__DEV__) {
    console.log('🔧 API Configuration:', {
      environment: currentEnv,
      baseUrl: baseConfig.BASE_URL,
      timeout: baseConfig.TIMEOUT,
    });
  }

  return baseConfig;
};

export const API_CONFIG = getApiConfig();

// Feature flags
export const FEATURES = {
  ENABLE_OFFLINE_MODE: __DEV__ || getCurrentEnvironment() === ENV.DEVELOPMENT,
  ENABLE_DEBUG_LOGGING: __DEV__,
  ENABLE_CRASH_REPORTING: getCurrentEnvironment() === ENV.PRODUCTION,
  ENABLE_ANALYTICS: getCurrentEnvironment() !== ENV.DEVELOPMENT,
  MAX_PHOTO_SIZE_MB: 15,
  MAX_PHOTOS_PER_PET: 10,
  CACHE_TTL_MINUTES: 30,
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Utility functions
export const isProduction = () => getCurrentEnvironment() === ENV.PRODUCTION;
export const isDevelopment = () => getCurrentEnvironment() === ENV.DEVELOPMENT;
export const isStaging = () => getCurrentEnvironment() === ENV.STAGING;