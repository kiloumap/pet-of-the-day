import { API_CONFIG } from '../config/api';

export const testApiConnection = async (): Promise<boolean> => {
    try {
      console.log(`🧪 Testing API connection to: ${API_CONFIG.BASE_URL}`);
      console.log(`🧪 Health check URL: ${API_CONFIG.BASE_URL}/health`);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ API Connection Test Error:', error);
      return false;
    }
};

export const testCORS = async (): Promise<boolean> => {
  try {
    console.log(`🧪 Testing CORS to: ${API_CONFIG.BASE_URL}`);

    // Make a CORS preflight request
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    console.log('CORS preflight response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('❌ CORS Test Error:', error);
    return false;
  }
};