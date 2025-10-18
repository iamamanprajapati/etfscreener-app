import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache utility for ETF data - with separate prices cache
const CACHE_KEY = 'etf_summary_data';
const CACHE_DATE_KEY = 'etf_summary_date';
const PRICES_CACHE_KEY = 'etf_prices_data';
const PRICES_CACHE_TIME_KEY = 'etf_prices_timestamp';
const PRICES_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper to safely handle AsyncStorage operations
const withAsyncStorage = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    console.warn('AsyncStorage error:', error);
    return fallback;
  }
};

export const cacheUtils = {
  // Check if cached data is still valid (same calendar day)
  isCacheValid: async () => {
    return await withAsyncStorage(async () => {
      const cachedDate = await AsyncStorage.getItem(CACHE_DATE_KEY);
      return cachedDate === new Date().toISOString().split('T')[0];
    }, false);
  },

  // Get cached data if valid
  getCachedData: async () => {
    return await withAsyncStorage(async () => {
      const isValid = await cacheUtils.isCacheValid();
      if (!isValid) return null;
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : null;
    }, null);
  },

  // Store data in cache with today's date
  setCachedData: async (data) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_DATE_KEY, today);
    } catch (error) {
      console.warn('Error caching data:', error);
    }
  },

  // Check if prices cache is still valid (within 1 hour)
  isPricesCacheValid: async () => {
    return await withAsyncStorage(async () => {
      const cachedTime = await AsyncStorage.getItem(PRICES_CACHE_TIME_KEY);
      if (!cachedTime) return false;
      const now = Date.now();
      const cacheTime = parseInt(cachedTime, 10);
      return (now - cacheTime) < PRICES_CACHE_DURATION;
    }, false);
  },

  // Get cached prices data if valid
  getCachedPrices: async () => {
    return await withAsyncStorage(async () => {
      const isValid = await cacheUtils.isPricesCacheValid();
      if (!isValid) {
        await AsyncStorage.removeItem(PRICES_CACHE_KEY);
        await AsyncStorage.removeItem(PRICES_CACHE_TIME_KEY);
        return null;
      }
      const cachedData = await AsyncStorage.getItem(PRICES_CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : null;
    }, null);
  },

  // Store prices data in cache with timestamp
  setCachedPrices: async (data) => {
    try {
      await AsyncStorage.setItem(PRICES_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(PRICES_CACHE_TIME_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Error caching prices data:', error);
    }
  },

  // Clear all cache
  clearCache: async () => {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEY,
        CACHE_DATE_KEY,
        PRICES_CACHE_KEY,
        PRICES_CACHE_TIME_KEY
      ]);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  },

  // Clear only prices cache
  clearPricesCache: async () => {
    try {
      await AsyncStorage.multiRemove([PRICES_CACHE_KEY, PRICES_CACHE_TIME_KEY]);
    } catch (error) {
      console.warn('Error clearing prices cache:', error);
    }
  },

  // Get cache info for debugging
  getCacheInfo: async () => {
    try {
      const cachedDate = await AsyncStorage.getItem(CACHE_DATE_KEY);
      const data = await AsyncStorage.getItem(CACHE_KEY);
      const pricesTime = await AsyncStorage.getItem(PRICES_CACHE_TIME_KEY);
      const pricesData = await AsyncStorage.getItem(PRICES_CACHE_KEY);
      
      const info = {
        summary: {
          exists: !!cachedDate && !!data,
          cachedDate,
          isValid: await cacheUtils.isCacheValid(),
          dataSize: data ? Math.round(data.length / 1024) : 0
        },
        prices: {
          exists: !!pricesTime && !!pricesData,
          isValid: await cacheUtils.isPricesCacheValid(),
          dataSize: pricesData ? Math.round(pricesData.length / 1024) : 0
        }
      };
      
      if (pricesTime) {
        const cacheTime = parseInt(pricesTime, 10);
        const ageMinutes = Math.round((Date.now() - cacheTime) / (1000 * 60));
        info.prices.cachedTime = new Date(cacheTime).toLocaleTimeString();
        info.prices.ageMinutes = ageMinutes;
      }
      
      return info;
    } catch (error) {
      console.warn('Error getting cache info:', error);
      return { summary: { exists: false }, prices: { exists: false } };
    }
  }
};
