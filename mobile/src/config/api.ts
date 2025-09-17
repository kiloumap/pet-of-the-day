import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = (): string => {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In development, use different URLs for different platforms
  if (__DEV__) {
    // For Expo Go app, use the local network IP
    if (Constants.manifest?.debuggerHost) {
      const debuggerHost = Constants.manifest.debuggerHost.split(':').shift();
      return `http://${debuggerHost}:8080`;
    }

    // Fallback URLs by platform
    if (Platform.OS === 'ios') {
      // iOS simulator can access localhost directly
      return 'http://localhost:8080';
    } else if (Platform.OS === 'android') {
      // Android emulator needs special IP for localhost
      return 'http://10.0.2.2:8080';
    } else {
      // Web development (Expo web runs on different ports)
      return 'http://localhost:8080';
    }
  }

  // Production URL - replace with your actual production API URL
  return 'https://your-production-api.com';
};

const apiUrl = getApiUrl();

// Debug logging in development
if (__DEV__) {
  console.log(`🌐 API Configuration:
  Platform: ${Platform.OS}
  URL: ${apiUrl}
  Expo debuggerHost: ${Constants.manifest?.debuggerHost || 'not available'}
  `);
}

export const API_CONFIG = {
  BASE_URL: apiUrl,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;