import React, { createContext, useContext, useState, useEffect } from 'react';
import WatchlistService from '../services/watchlistService';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authService } = useAuth();
  const [watchlistService, setWatchlistService] = useState(null);

  // Ensure watchlist is always an array
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];

  // Initialize watchlist service when authService is available
  useEffect(() => {
    if (authService) {
      setWatchlistService(new WatchlistService(authService));
    }
  }, [authService]);

  // Load watchlist from API or storage on app start
  useEffect(() => {
    loadWatchlist();
  }, [watchlistService]);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      
      // Only load from API if user is authenticated
      if (watchlistService && authService.isAuthenticated()) {
        try {
          const apiWatchlist = await watchlistService.getWatchlist();
          console.log('API watchlist response:', apiWatchlist);
          
          // Handle different response formats
          let watchlistArray = [];
          if (Array.isArray(apiWatchlist)) {
            watchlistArray = apiWatchlist;
          } else if (apiWatchlist?.data && Array.isArray(apiWatchlist.data)) {
            watchlistArray = apiWatchlist.data;
          } else if (apiWatchlist?.symbols && Array.isArray(apiWatchlist.symbols)) {
            // Convert symbols array to watchlist items format
            watchlistArray = apiWatchlist.symbols.map(symbol => ({ symbol, addedAt: new Date().toISOString() }));
          } else {
            console.warn('Unexpected watchlist response structure:', apiWatchlist);
            watchlistArray = [];
          }
          
          console.log('Processed watchlist array:', watchlistArray);
          setWatchlist(watchlistArray);
        } catch (apiError) {
          console.error('API watchlist load failed:', apiError);
          setWatchlist([]);
        }
      } else {
        // If not authenticated, set empty watchlist
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol, etfData = {}) => {
    try {
      // Try API first if authenticated
      if (watchlistService && authService.isAuthenticated()) {
        try {
          await watchlistService.addToWatchlist(symbol);
          // Reload watchlist from API
          const apiWatchlist = await watchlistService.getWatchlist();
          
          // Handle different response formats
          let watchlistArray = [];
          if (Array.isArray(apiWatchlist)) {
            watchlistArray = apiWatchlist;
          } else if (apiWatchlist?.data && Array.isArray(apiWatchlist.data)) {
            watchlistArray = apiWatchlist.data;
          } else if (apiWatchlist?.symbols && Array.isArray(apiWatchlist.symbols)) {
            // Convert symbols array to watchlist items format
            watchlistArray = apiWatchlist.symbols.map(symbol => ({ symbol, addedAt: new Date().toISOString() }));
          }
          
          setWatchlist(watchlistArray);
          return true;
        } catch (apiError) {
          console.error('API add to watchlist failed:', apiError);
          throw apiError;
        }
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      // Try API first if authenticated
      if (watchlistService && authService.isAuthenticated()) {
        try {
          await watchlistService.removeFromWatchlist(symbol);
          // Reload watchlist from API
          const apiWatchlist = await watchlistService.getWatchlist();
          
          // Handle different response formats
          let watchlistArray = [];
          if (Array.isArray(apiWatchlist)) {
            watchlistArray = apiWatchlist;
          } else if (apiWatchlist?.data && Array.isArray(apiWatchlist.data)) {
            watchlistArray = apiWatchlist.data;
          } else if (apiWatchlist?.symbols && Array.isArray(apiWatchlist.symbols)) {
            // Convert symbols array to watchlist items format
            watchlistArray = apiWatchlist.symbols.map(symbol => ({ symbol, addedAt: new Date().toISOString() }));
          }
          
          setWatchlist(watchlistArray);
          return true;
        } catch (apiError) {
          console.error('API remove from watchlist failed:', apiError);
          throw apiError;
        }
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  };

  const isInWatchlist = (symbol) => {
    return safeWatchlist.some(item => item.symbol === symbol);
  };

  const clearWatchlist = async () => {
    try {
      setWatchlist([]);
      return true;
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      throw error;
    }
  };

  const getWatchlistCount = () => {
    return safeWatchlist.length;
  };

  const value = {
    watchlist: safeWatchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    getWatchlistCount
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
