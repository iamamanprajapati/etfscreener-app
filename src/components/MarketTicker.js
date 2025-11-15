import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Text from './CustomText';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE, PRICES_API_URL } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Indian market holidays for 2024-2025
const INDIAN_MARKET_HOLIDAYS = [
  '2024-01-26', // Republic Day
  '2024-03-08', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Eid ul-Fitr
  '2024-04-17', // Ram Navami
  '2024-05-01', // Labour Day
  '2024-06-17', // Eid ul-Adha
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-10-31', // Diwali Balipratipada
  '2024-11-01', // Diwali
  '2024-11-15', // Guru Nanak Jayanti
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-04-18', // Good Friday
  '2025-04-21', // Ram Navami
  '2025-05-01', // Labour Day
  '2025-06-07', // Eid ul-Adha
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-20', // Dussehra
  '2025-10-21', // Diwali
  '2025-11-05', // Guru Nanak Jayanti
];

// Check if today is a market holiday
const isMarketHoliday = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Check if it's a weekend (Saturday or Sunday)
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  
  // Check if it's a listed holiday
  return INDIAN_MARKET_HOLIDAYS.includes(todayStr);
};

// Get holiday message
const getHolidayMessage = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  if (dayOfWeek === 0) {
    return 'Indian Stock Market Closed - Sunday';
  } else if (dayOfWeek === 6) {
    return 'Indian Stock Market Closed - Saturday';
  } else {
    return 'Indian Stock Market Closed - Market Holiday';
  }
};

const MarketTicker = () => {
  const { colors } = useTheme();
  const [marketData, setMarketData] = useState([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    const holiday = isMarketHoliday();
    setIsHoliday(holiday);
    
    if (!holiday) {
      fetchMarketData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      
      // First, try to fetch from dedicated indices endpoint
      try {
        const response = await fetch(`${API_BASE}/api/indices/indian`, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Expected format: [{ name: 'Nifty 50', value: 24500, change: 0.5 }, ...]
          // Or: { nifty50: { value: 24500, change: 0.5 }, sensex: { value: 80000, change: -0.3 }, ... }
          
          let indices = [];
          
          if (Array.isArray(data)) {
            indices = data;
          } else if (typeof data === 'object') {
            // Convert object format to array
            if (data.nifty50 || data.nifty) {
              indices.push({
                name: 'Nifty 50',
                value: data.nifty50?.value || data.nifty?.value || 0,
                change: data.nifty50?.change || data.nifty?.change || 0
              });
            }
            if (data.sensex) {
              indices.push({
                name: 'Sensex',
                value: data.sensex?.value || 0,
                change: data.sensex?.change || 0
              });
            }
            if (data.niftyBank || data.bankNifty) {
              indices.push({
                name: 'Bank Nifty',
                value: data.niftyBank?.value || data.bankNifty?.value || 0,
                change: data.niftyBank?.change || data.bankNifty?.change || 0
              });
            }
          }
          
          if (indices.length > 0) {
            setMarketData(indices);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        // Fall through to try prices API
      }
      
      // Fallback: Extract index data from prices API using ETF proxies
      const pricesResponse = await fetch(PRICES_API_URL);
      if (pricesResponse.ok) {
        const pricesArray = await pricesResponse.json();
        const indices = [];
        
        // NIFTYBEES.NS represents Nifty 50
        const niftyBees = pricesArray.find(item => item.key === 'NIFTYBEES.NS');
        if (niftyBees) {
          indices.push({
            name: 'Nifty 50',
            value: niftyBees.currentPrice || 0,
            change: niftyBees.changePercent || 0
          });
        }
        
        // BANKBEES.NS represents Bank Nifty
        const bankBees = pricesArray.find(item => item.key === 'BANKBEES.NS');
        if (bankBees) {
          indices.push({
            name: 'Bank Nifty',
            value: bankBees.currentPrice || 0,
            change: bankBees.changePercent || 0
          });
        }
        
        if (indices.length > 0) {
          setMarketData(indices);
          setIsLoading(false);
          return;
        }
      }
      
      // If all else fails, show empty state (will show holiday message if applicable)
      setMarketData([]);
    } catch (error) {
      console.warn('Failed to fetch market data:', error);
      setMarketData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num == null || num === 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // Format percentage change
  const formatChange = (change) => {
    if (change == null) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${Number(change).toFixed(2)}%`;
  };

  // Create ticker text
  const getTickerText = () => {
    if (isHoliday) {
      return getHolidayMessage();
    }
    
    if (isLoading) {
      return 'Loading market data...';
    }
    
    if (marketData.length === 0) {
      return 'Market data unavailable';
    }
    
    return marketData
      .map(item => {
        const value = formatNumber(item.value);
        const change = formatChange(item.change);
        const changeColor = item.change >= 0 ? '🟢' : '🔴';
        return `${item.name}: ${value} (${change}) ${changeColor}`;
      })
      .join('  •  ');
  };

  // Start scrolling animation
  useEffect(() => {
    if (isLoading) return;
    
    const tickerText = getTickerText();
    // Estimate text width (approximately 7 pixels per character for font size 13)
    const textWidth = tickerText.length * 7;
    const totalWidth = textWidth + SCREEN_WIDTH;
    
    // Stop any existing animation
    scrollX.stopAnimation();
    scrollX.setValue(0);
    
    // Start infinite scroll animation
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: -textWidth,
          duration: Math.max(15000, textWidth * 10), // Adjust speed based on text length
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    
    animationRef.current = anim;
    anim.start();
    
    return () => {
      anim.stop();
      scrollX.stopAnimation();
    };
  }, [marketData, isHoliday, isLoading]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const tickerText = getTickerText();
  const textWidth = tickerText.length * 7;
  const totalWidth = textWidth * 2 + SCREEN_WIDTH * 2; // Duplicate text for seamless loop

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.tickerWrapper}>
        <Animated.View
          style={[
            styles.tickerContent,
            {
              transform: [{ translateX: scrollX }],
            },
          ]}
        >
          <Text style={[styles.tickerText, { color: colors.text }]} numberOfLines={1}>
            {tickerText}  •  {tickerText}  •  {tickerText}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    zIndex: 1000,
  },
  tickerWrapper: {
    height: 24,
    overflow: 'hidden',
  },
  tickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  tickerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MarketTicker;

