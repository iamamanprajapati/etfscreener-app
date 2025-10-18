import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheUtils } from '../utils/cache';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters } from '../utils/helpers';
import { getETFDescription, getETFCategory } from '../data/etfDescriptions';
import { getDisplaySymbol } from '../utils/symbolUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricsCards from '../components/MetricsCards';

const ETFDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { symbol } = route.params;
  
  const [etfData, setEtfData] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchETFData();
  }, [symbol]);

  const fetchETFData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Check for cached data first
      const cachedData = await cacheUtils.getCachedData();
      
      let summaryData;
      if (cachedData) {
        summaryData = cachedData;
      } else {
        const response = await fetch(SUMMARY_API_URL);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        summaryData = await response.json();
        await cacheUtils.setCachedData(summaryData);
      }
      
      // Get prices data from cache or fetch
      let pricesData = {};
      const cachedPrices = await cacheUtils.getCachedPrices();
      
      if (cachedPrices && (await cacheUtils.isPricesCacheValid())) {
        pricesData = cachedPrices;
      } else {
        try {
          const pricesResponse = await fetch(PRICES_API_URL);
          if (pricesResponse.ok) {
            const pricesArray = await pricesResponse.json();
            pricesData = pricesArray.reduce((acc, item) => {
              if (item.key) {
                acc[item.key] = {
                  currentPrice: item.currentPrice,
                  changePercent: item.changePercent,
                  change: item.change,
                  volume: item.volume,
                  previousClose: item.previousClose
                };
              }
              return acc;
            }, {});
            
            if (Object.keys(pricesData).length > 0) {
              await cacheUtils.setCachedPrices(pricesData);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch prices for ETF detail:', error);
        }
      }
      
      const etf = summaryData.find(item => item.symbol === symbol);
      if (etf) {
        setEtfData(etf);
        if (pricesData[symbol]) {
          setPriceData(pricesData[symbol]);
        }
      } else {
        setError('ETF not found');
      }
    } catch (err) {
      console.error('ETF detail fetch error:', err);
      setError('Failed to fetch ETF data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    try {
      if (isInWatchlist(symbol)) {
        await removeFromWatchlist(symbol);
        Alert.alert('Success', 'ETF removed from watchlist!');
      } else {
        await addToWatchlist(symbol, {
          details: etfData?.details,
          currentPrice: priceData?.currentPrice || etfData?.details?.lastClosePrice,
          changePercent: priceData?.changePercent,
          volume: priceData?.volume || etfData?.details?.lastDayVolume
        });
        Alert.alert('Success', 'ETF added to watchlist!');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist. Please try again.');
    }
  };

  const handleComparePress = () => {
    navigation.navigate('MainTabs', { 
      screen: 'Compare',
      params: { symbols: symbol }
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Loading..." 
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <LoadingSpinner size="large" text="Loading ETF details..." />
      </View>
    );
  }

  if (error || !etfData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Error" 
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error || 'ETF data not available'}</Text>
        </View>
      </View>
    );
  }

  const { details } = etfData;
  const etfDescription = getETFDescription(symbol);
  const etfCategory = getETFCategory(symbol);
  const currentPrice = priceData?.currentPrice || details.lastClosePrice;
  const changePercent = priceData?.changePercent;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={getDisplaySymbol(symbol)}
        showBackButton={true}
        onBackPress={handleBackPress}
        showThemeToggle={false}
        rightButton={
          <TouchableOpacity 
            style={[styles.watchlistButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleWatchlistToggle}
          >
            <Ionicons 
              name={isInWatchlist(symbol) ? "star" : "star-outline"} 
              size={24} 
              color={isInWatchlist(symbol) ? "#fbbf24" : colors.text} 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Price Performance Overview */}
        <View style={[styles.priceOverview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.priceHeader}>
            <Text style={[styles.priceTitle, { color: colors.text }]}>Current Performance</Text>
            <View style={[styles.priceBadge, { backgroundColor: (parseNumber(changePercent) >= 0 ? colors.positive : colors.negative) + '20' }]}>
              <Ionicons 
                name={parseNumber(changePercent) >= 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={parseNumber(changePercent) >= 0 ? colors.positive : colors.negative} 
              />
              <Text style={[
                styles.priceBadgeText, 
                { color: parseNumber(changePercent) >= 0 ? colors.positive : colors.negative }
              ]}>
                {parseNumber(changePercent) >= 0 ? 'Gaining' : 'Declining'}
              </Text>
            </View>
          </View>
          
          <View style={styles.priceDetails}>
            <View style={styles.priceMain}>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                {currentPrice != null ? `₹${parseNumber(currentPrice).toFixed(2)}` : '—'}
              </Text>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Current Price</Text>
            </View>
            
            <View style={styles.priceChange}>
              <Text style={[
                styles.priceChangeValue, 
                { color: parseNumber(changePercent) >= 0 ? colors.positive : colors.negative }
              ]}>
                {changePercent != null ? 
                  `${parseNumber(changePercent) >= 0 ? '+' : ''}${parseNumber(changePercent).toFixed(2)}%` : 
                  '—'
                }
              </Text>
              <Text style={[styles.priceChangeLabel, { color: colors.textSecondary }]}>Today's Change</Text>
            </View>
          </View>
        </View>


        {/* ETF Description and Category */}
        {(etfDescription || etfCategory) && (
          <View style={[styles.infoHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoHeaderContent}>
              {etfCategory && (
                <View style={[styles.categoryContainer]}>
                  <Ionicons name="folder" size={16} color={colors.primary} />
                  <Text style={[styles.categoryText, { color: colors.primary }]}>{etfCategory}</Text>
                </View>
              )}
              {etfDescription && (
                <Text style={[styles.descriptionText, { color: colors.text }]}>{etfDescription}</Text>
              )}
            </View>
          </View>
        )}

        {/* Enhanced Metrics Cards */}
        <MetricsCards 
          metrics={{
            // Price Performance
            weekReturn: details["1weekReturns"],
            monthReturn: details["1monthReturns"],
            yearReturn: details["1yearReturns"],
            twoYearReturn: details["2yearReturns"],
            
            // RSI Indicators
            dailyRSI: details.dailyRSI,
            weeklyRSI: details.weeklyRSI,
            monthlyRSI: details.monthlyRSI,
            
            // Price & Volume
            currentPrice: currentPrice,
            todayChange: changePercent,
            volume: details.lastDayVolume,
            downFromHigh: details.downFrom2YearHigh,
            
            // Valuation
            peRatio: details.priceToEarning
          }}
          etfInfo={{
            symbol: getDisplaySymbol(symbol),
            category: etfCategory,
            recordDate: details.recordDate
          }}
          priceRange={details.priceRange}
        />


        {/* Enhanced Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="grid-outline" size={24} color={colors.surface} />
                <View style={styles.buttonTextContainer}>
                  <Text style={[styles.primaryButtonText, { color: colors.surface }]}>View All ETFs</Text>
                  <Text style={[styles.primaryButtonSubtext, { color: colors.surface + 'CC' }]}>Browse all available ETFs</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={handleComparePress}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="bar-chart-outline" size={24} color={colors.primary} />
                <View style={styles.buttonTextContainer}>
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Compare ETFs</Text>
                  <Text style={[styles.secondaryButtonSubtext, { color: colors.textSecondary }]}>Compare with other ETFs</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  watchlistButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  
  // Price Overview Section
  priceOverview: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceMain: {
    flex: 1,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceChange: {
    alignItems: 'flex-end',
  },
  priceChangeValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceChangeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Key Metrics Section
  keyMetricsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  keyMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  keyMetricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keyMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  keyMetricTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  keyMetricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  keyMetricStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Info Header Section
  infoHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoHeaderContent: {
    gap: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  additionalInfo: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  additionalItems: {
    gap: 8,
  },
  additionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  additionalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  // Quick Actions Section
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  quickActions: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});

export default ETFDetailScreen;
