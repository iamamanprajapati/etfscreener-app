// Watchlist service for API integration
const API_BASE_URL = 'https://etf-scanner-backend.onrender.com/api';

class WatchlistService {
  constructor(authService) {
    this.authService = authService;
  }

  // Add symbol to watchlist
  async addToWatchlist(symbol) {
    try {
      const response = await this.authService.makeAuthenticatedRequest('/user/watchlist/symbol', {
        method: 'POST',
        body: JSON.stringify({ symbol })
      });
      
      return response;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  // Remove symbol from watchlist
  async removeFromWatchlist(symbol) {
    try {
      const response = await this.authService.makeAuthenticatedRequest(`/user/watchlist/symbol/${symbol}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  // Get user's watchlist
  async getWatchlist() {
    try {
      const response = await this.authService.makeAuthenticatedRequest('/user/watchlist');
      
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && Array.isArray(response.watchlist)) {
        return response.watchlist;
      } else if (response && Array.isArray(response.symbols)) {
        return response; // Return the full response object with symbols array
      } else {
        console.warn('Unexpected watchlist response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  // Check if symbol is in watchlist
  async isInWatchlist(symbol) {
    try {
      const watchlist = await this.getWatchlist();
      
      // Handle different response formats
      if (Array.isArray(watchlist)) {
        return watchlist.some(item => item.symbol === symbol);
      } else if (watchlist && Array.isArray(watchlist.symbols)) {
        return watchlist.symbols.includes(symbol);
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return false;
    }
  }
}

export default WatchlistService;
