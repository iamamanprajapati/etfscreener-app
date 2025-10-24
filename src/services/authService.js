// Authentication service for backend API integration
const API_BASE_URL = 'https://etf-scanner-backend.onrender.com/api';

class AuthService {
  constructor() {
    this.accessToken = null;
    this.user = null;
  }

  // Set access token for authenticated requests
  setAccessToken(token) {
    this.accessToken = token;
  }

  // Get access token
  getAccessToken() {
    return this.accessToken;
  }

  // Clear access token
  clearAccessToken() {
    this.accessToken = null;
  }

  // Authenticate with Google using the backend API
  async authenticateWithGoogle(googleAuthResult) {
    try {
      console.log('Authenticating with backend API...');
      
      // Extract the serverAuthCode from the Google auth result
      const serverAuthCode = googleAuthResult.data?.serverAuthCode;
      if (!serverAuthCode) {
        throw new Error('No server auth code received from Google');
      }
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': 'https://etfscreen.in',
          'Referer': 'https://etfscreen.in/',
        },
        body: JSON.stringify({
          code: serverAuthCode,
          redirect_uri: 'https://etfscreen.in/auth/callback'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Authentication failed: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Backend authentication successful:', data);

      // Store the access token
      if (data.accessToken) {
        this.setAccessToken(data.accessToken);
        this.user = data.user || null;
      }

      return {
        success: true,
        accessToken: data.accessToken,
        user: data.user,
        data: data
      };

    } catch (error) {
      console.error('Backend authentication error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to authentication server. Please check your internet connection.');
      }
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Authentication server is not responding. Please try again.');
      }
      
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Make authenticated requests to the backend
  async makeAuthenticatedRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearAccessToken();
          throw new Error('Authentication expired. Please sign in again.');
        }
        throw new Error(`Request failed: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }

  // Get user profile from backend
  async getUserProfile() {
    try {
      return await this.makeAuthenticatedRequest('/auth/profile');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Logout from backend
  async logout() {
    try {
      if (this.accessToken) {
        await this.makeAuthenticatedRequest('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local logout even if backend logout fails
    } finally {
      this.clearAccessToken();
      this.user = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }
}

// Export a singleton instance
export default new AuthService();
