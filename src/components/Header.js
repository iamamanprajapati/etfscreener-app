import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Text from './CustomText';
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
    return '🇮🇳 INDIAN MARKETS CLOSED - SUNDAY';
  } else if (dayOfWeek === 6) {
    return '🇮🇳 INDIAN MARKETS CLOSED - SATURDAY';
  } else {
    return '🇮🇳 INDIAN MARKETS CLOSED - MARKET HOLIDAY';
  }
};

const Header = ({ 
  title = "ETF Dashboard", 
  showBackButton = false,
  onBackPress,
  showPrice = false,
  currentPrice,
  changePercent,
  showThemeToggle = false,
  rightButton = null,
  showTicker = true,
  titleColor = null
}) => {
  const { colors } = useTheme();
  
  // Market ticker state
  const [marketData, setMarketData] = useState([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isTickerLoading, setIsTickerLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  const formatPrice = (price) => {
    if (price == null) return '—';
    return `₹${Number(price).toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (change == null) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${Number(change).toFixed(2)}%`;
  };

  // Market ticker functions
  useEffect(() => {
    if (!showTicker) return;
    
    const holiday = isMarketHoliday();
    setIsHoliday(holiday);
    setIsTickerLoading(true); // Start with loading state
    
    if (!holiday) {
      fetchMarketData();
    } else {
      setIsTickerLoading(false);
    }
  }, [showTicker]);

  const fetchMarketData = async () => {
    try {
      setIsTickerLoading(true);
      
      // First, try to fetch from dedicated indices endpoint
      try {
        const response = await fetch(`${API_BASE}/api/indices/indian`, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          
          let indices = [];
          
          if (Array.isArray(data)) {
            indices = data;
          } else if (typeof data === 'object') {
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
            setIsTickerLoading(false);
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
          setIsTickerLoading(false);
          return;
        }
      }
      
      setMarketData([]);
    } catch (error) {
      console.warn('Failed to fetch market data:', error);
      setMarketData([]);
    } finally {
      setIsTickerLoading(false);
    }
  };

  // Format number with commas
  const formatTickerNumber = (num) => {
    if (num == null || num === 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // Format percentage change
  const formatTickerChange = (change) => {
    if (change == null) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${Number(change).toFixed(2)}%`;
  };

  // Create ticker text - always returns something
  const getTickerText = () => {
    if (isHoliday) {
      return getHolidayMessage();
    }
    
    if (isTickerLoading) {
      return '🇮🇳 LOADING MARKET DATA...';
    }
    
    if (marketData.length === 0) {
      return '🇮🇳 INDIAN MARKETS - DATA UNAVAILABLE';
    }
    
    const tickerContent = marketData
      .map(item => {
        const value = formatTickerNumber(item.value);
        const change = formatTickerChange(item.change);
        const changeColor = item.change >= 0 ? '🟢' : '🔴';
        return `🇮🇳 ${item.name.toUpperCase()}: ${value} (${change}) ${changeColor}`;
      })
      .join('  •  ');
    
    // Ensure we always return something
    return tickerContent || '🇮🇳 INDIAN MARKETS';
  };

  // Start scrolling animation - seamless infinite scroll
  useEffect(() => {
    if (!showTicker) return;
    
    const tickerText = getTickerText();
    if (!tickerText) return;
    
    // Estimate text width (approximately 7 pixels per character for font size 13)
    const textWidth = tickerText.length * 7;
    const separatorWidth = 3; // Width of "  •  "
    const singleItemWidth = textWidth + separatorWidth;
    
    // Calculate how many repetitions we need to cover screen + buffer
    const repetitionsNeeded = Math.ceil((SCREEN_WIDTH * 2) / singleItemWidth) + 2;
    
    // Stop any existing animation
    scrollX.stopAnimation();
    scrollX.setValue(0);
    
    // Start seamless infinite scroll animation
    // Scroll by one text width, then reset instantly (but text repeats so it looks seamless)
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: -singleItemWidth,
          duration: Math.max(15000, singleItemWidth * 10),
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
  }, [marketData, isHoliday, isTickerLoading, showTicker]);

  // Always get ticker text - ensure it never returns empty
  const tickerText = showTicker ? getTickerText() : '🇮🇳 INDIAN MARKETS';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Market Ticker - Full width above title - Always visible */}
      {showTicker && (
        <View style={[styles.tickerWrapper, { backgroundColor: colors.background }]}>
          <Animated.View
            style={[
              styles.tickerContent,
              {
                transform: [{ translateX: scrollX }],
                width: SCREEN_WIDTH * 4, // Wide enough to hold all repeated text
              },
            ]}
          >
            <Text style={styles.tickerText} numberOfLines={1}>
              {(() => {
                // Repeat text enough times to ensure seamless scrolling - no gaps
                const textWidth = tickerText.length * 7;
                const separatorWidth = 3;
                const itemWidth = textWidth + separatorWidth;
                const repetitions = Math.ceil((SCREEN_WIDTH * 4) / itemWidth) + 10;
                return Array(repetitions).fill(tickerText).join('  •  ');
              })()}
            </Text>
          </Animated.View>
        </View>
      )}
      
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: titleColor || colors.text }]}>{title}</Text>
          {showPrice && (
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.text }]}>{formatPrice(currentPrice)}</Text>
              <Text style={[
                styles.change,
                changePercent > 0 ? { color: colors.positive } : { color: colors.negative }
              ]}>
                {formatChange(changePercent)}
              </Text>
            </View>
          )}
        </View>

        {rightButton}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 30,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  change: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeToggle: {
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  tickerWrapper: {
    height: 20,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
    width: '100%',
  },
  tickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 8,
  },
  tickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b', // Golden/orange color
    letterSpacing: 0.5,
  },
});

export default Header;
