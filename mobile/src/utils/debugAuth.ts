import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

export const debugAuthState = async () => {
  console.log('🔍 AUTH DEBUG START');
  console.log('===================');

  try {
    // Check AsyncStorage directly
    const tokenData = await AsyncStorage.getItem('auth_tokens');
    console.log('📱 AsyncStorage raw data:', tokenData);

    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      console.log('🔐 Parsed tokens:', {
        hasAccessToken: !!parsed.accessToken,
        tokenLength: parsed.accessToken?.length,
        userId: parsed.userId,
        tokenStart: parsed.accessToken?.length <= 30
          ? parsed.accessToken + '...'
          : parsed.accessToken?.substring(0, 30) + '...'
      });
    }
  } catch (error) {
    console.error('🚨 Auth debug error:', error);
    return;
  }

  try {
    // Check API service auth state
    const isAuth = await apiService.isAuthenticated();
    console.log('🔒 API Service authenticated:', isAuth);
  } catch (error) {
    console.error('🚨 Auth debug error:', error);
    return;
  }

  try {
    const userId = await apiService.getStoredUserId();
    console.log('👤 Stored user ID:', userId);
  } catch (error) {
    console.error('🚨 Auth debug error:', error);
    return;
  }

  // Try to get current user
  try {
    const user = await apiService.getCurrentUser();
    console.log('✅ Current user API call successful:', user);
  } catch (error: any) {
    console.log('❌ Current user API call failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
  }

  console.log('🔍 AUTH DEBUG END');
};