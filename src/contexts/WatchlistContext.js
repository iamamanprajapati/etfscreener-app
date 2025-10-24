import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const WATCHLIST_STORAGE_KEY = '@etf_watchlist';

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
      
      // Try to load from API first if user is authenticated
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
          return;
        } catch (apiError) {
          console.log('API watchlist load failed, falling back to local storage:', apiError);
        }
      }
      
      // Fallback to local storage
      const storedWatchlist = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        const parsedWatchlist = JSON.parse(storedWatchlist);
        setWatchlist(Array.isArray(parsedWatchlist) ? parsedWatchlist : []);
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWatchlist = async (newWatchlist) => {
    try {
      await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
      throw error;
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
          console.log('API add to watchlist failed, falling back to local storage:', apiError);
        }
      }
      
      // Fallback to local storage
      const watchlistItem = {
        symbol,
        addedAt: new Date().toISOString(),
        ...etfData
      };

      const newWatchlist = [...safeWatchlist, watchlistItem];
      await saveWatchlist(newWatchlist);
      return true;
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
          console.log('API remove from watchlist failed, falling back to local storage:', apiError);
        }
      }
      
      // Fallback to local storage
      const newWatchlist = safeWatchlist.filter(item => item.symbol !== symbol);
      await saveWatchlist(newWatchlist);
      return true;
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
      await AsyncStorage.removeItem(WATCHLIST_STORAGE_KEY);
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
