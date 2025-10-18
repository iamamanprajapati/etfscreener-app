import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const WATCHLIST_STORAGE_KEY = '@etf_watchlist';

  // Load watchlist from storage on app start
  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const storedWatchlist = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
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
      const watchlistItem = {
        symbol,
        addedAt: new Date().toISOString(),
        ...etfData
      };

      const newWatchlist = [...watchlist, watchlistItem];
      await saveWatchlist(newWatchlist);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      const newWatchlist = watchlist.filter(item => item.symbol !== symbol);
      await saveWatchlist(newWatchlist);
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(item => item.symbol === symbol);
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
    return watchlist.length;
  };

  const value = {
    watchlist,
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
