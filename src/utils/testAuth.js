// Test utility for authentication flow
import authService from '../services/authService';

export const testAuthentication = async () => {
  console.log('Testing authentication service...');
  
  try {
    // Test if authService is properly initialized
    console.log('AuthService initialized:', !!authService);
    console.log('Current access token:', authService.getAccessToken());
    console.log('Is authenticated:', authService.isAuthenticated());
    console.log('Current user:', authService.getCurrentUser());
    
    return {
      success: true,
      message: 'Authentication service is properly initialized'
    };
  } catch (error) {
    console.error('Authentication test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const testBackendConnection = async () => {
  console.log('Testing backend connection...');
  
  try {
    const response = await fetch('https://etf-scanner-backend.onrender.com/api/health', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      }
    });
    
    if (response.ok) {
      console.log('Backend connection successful');
      return {
        success: true,
        message: 'Backend is reachable'
      };
    } else {
      console.log('Backend connection failed:', response.status);
      return {
        success: false,
        message: `Backend returned status: ${response.status}`
      };
    }
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
