import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Switch,
  Dimensions,
} from 'react-native';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters, renderDownFromHigh } from '../utils/helpers';
import { getDisplaySymbol, getFullSymbol } from '../utils/symbolUtils';
import { getETFCategory } from '../data/etfDescriptions';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AdMobBanner from '../components/AdMobBanner';
import { BarChart, LineChart, ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

// Memoized ETF Item Component for better performance
const ETFItem = memo(({ 
  item, 
  isSelected, 
  isDisabled, 
  inWatchlist, 
  isLoading, 
  onToggle, 
  onNavigate, 
  onAddToWatchlist, 
  colors 
}) => {
  return (
    <View style={[
      styles.etfItem, 
      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      isSelected && { backgroundColor: 'rgba(91, 155, 253, 0.2)' }
    ]}>
      <TouchableOpacity
        style={styles.etfItemContent}
        onPress={() => onToggle(item.symbol)}
        disabled={isDisabled}
      >
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={20}
          color={isSelected ? colors.primary : isDisabled ? colors.border : colors.textSecondary}
        />
        <Text style={[
          styles.etfSymbol, 
          { color: isDisabled ? 'rgba(255, 255, 255, 0.6)' : '#ffffff' },
        ]}>
          {getDisplaySymbol(item.symbol)}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.etfItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => onNavigate(item.symbol)}
        >
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        
        {!inWatchlist && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => onAddToWatchlist(item.symbol)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="star-outline" size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.item.symbol === nextProps.item.symbol &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.inWatchlist === nextProps.inWatchlist &&
    prevProps.isLoading === nextProps.isLoading
  );
});

ETFItem.displayName = 'ETFItem';

const CompareScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  const { user } = useAuth();
  const { symbols } = route.params || {};
  
  const [data, setData] = useState([]);
  const [pricesData, setPricesData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'changePercent', dir: 'desc' });
  const [loadingSymbols, setLoadingSymbols] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'graph'
  
  const scrollViewRef = useRef(null);

  const MAX_SELECTION = 6;
  const screenWidth = Dimensions.get('window').width;

  const METRICS = [
    { key: 'lastClosePrice', label: 'Current Price', render: formatters.price, sortable: true },
    { key: 'changePercent', label: 'Change %', render: formatters.percent, sortable: true },
    { key: 'lastDayVolume', label: 'Volume', render: formatters.number, sortable: true },
    { key: 'dailyRSI', label: 'RSI (D)', render: formatters.rsi, sortable: true },
    { key: 'weeklyRSI', label: 'RSI (W)', render: formatters.rsi, sortable: true },
    { key: 'monthlyRSI', label: 'RSI (M)', render: formatters.rsi, sortable: true },
    { key: 'weeklyReturn', label: '1W %', render: formatters.percent, sortable: true },
    { key: 'monthlyReturn', label: '1M %', render: formatters.percent, sortable: true },
    { key: 'yearlyReturn', label: '1Y %', render: formatters.percent, sortable: true },
    { key: 'twoYearReturn', label: '2Y %', render: formatters.percent, sortable: true },
    { key: 'downFrom2YearHigh', label: 'Down from 2Y High', render: renderDownFromHigh, sortable: true },
    { key: 'sector', label: 'Sector', sortable: false },
  ];

  // Process raw data function - moved before useEffect to avoid hoisting issues
  const processRawData = (summaryData, pricesData = {}) => {
    return (summaryData || []).map((row) => {
      const details = row.details ?? {};
      const symbol = row.symbol ?? '—';
      const priceInfo = pricesData[symbol] || {};
      
      const currentPrice = priceInfo.currentPrice || priceInfo.price || priceInfo.lastPrice || priceInfo.current;
      const changePercent = priceInfo.changePercent || priceInfo.change || priceInfo.percentChange || priceInfo.changePct;

      return {
        symbol,
        sector: getETFCategory(getFullSymbol(symbol)),
        lastClosePrice: parseNumber(details.lastClosePrice),
        currentPrice: parseNumber(currentPrice),
        changePercent: parseNumber(changePercent),
        lastDayVolume: parseNumber(details.lastDayVolume),
        downFrom2YearHigh: parseNumber(details.downFrom2YearHigh),
        dailyRSI: parseNumber(details.dailyRSI),
        weeklyRSI: parseNumber(details.weeklyRSI),
        monthlyRSI: parseNumber(details.monthlyRSI),
        weeklyReturn: parseNumber(details['1weekReturns']),
        monthlyReturn: parseNumber(details['1monthReturns']),
        yearlyReturn: parseNumber(details['1yearReturns']),
        twoYearReturn: parseNumber(details['2yearReturns']),
      };
    });
  };

  // Parse URL parameters for pre-selected symbols
  useEffect(() => {
    if (symbols) {
      const symbolsArray = symbols.split(',').filter(s => s.trim());
      setSelected(prev => {
        const newSelection = [...new Set([...prev, ...symbolsArray])].slice(0, MAX_SELECTION);
        return JSON.stringify(newSelection) !== JSON.stringify(prev) ? newSelection : prev;
      });
      // If symbols are provided, open the modal to show selection
      if (symbolsArray.length > 0) {
        setIsModalVisible(true);
      }
    }
  }, [symbols]);

  // Enhanced data fetching with refresh support
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage('');

      // Fetch data from backend
      const [summaryResult, pricesResult] = await Promise.allSettled([
        fetch(SUMMARY_API_URL, { 
          method: 'GET', 
          headers: { 'Accept': 'application/json' }, 
          mode: 'cors' 
        })
          .then(resp => {
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            return resp.json();
          }),
        fetch(PRICES_API_URL)
          .then(resp => {
            if (!resp.ok) return null;
            return resp.json();
          })
          .then(pricesArray => {
            if (!pricesArray) return {};
            return pricesArray.reduce((acc, item) => {
              const symbol = item.key;
              if (symbol) {
                acc[symbol] = {
                  currentPrice: item.currentPrice,
                  changePercent: item.changePercent,
                  change: item.change,
                  volume: item.volume,
                  previousClose: item.previousClose
                };
              }
              return acc;
            }, {});
          })
          .catch(error => {
            console.warn('Failed to fetch prices:', error);
            return {};
          })
      ]);

      const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
      const pricesData = pricesResult.status === 'fulfilled' ? pricesResult.value : {};

      // Only render when we have summary data
      if (summaryData) {
        setPricesData(pricesData);
        setData(processRawData(summaryData, pricesData));
      } else {
        throw new Error('Failed to fetch summary data');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch data');
      console.error('Data fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = data
      .filter((r) => (q ? r.symbol.toLowerCase().includes(q) : true));
    
    // Create a Set for fast lookup
    const selectedSet = new Set(selected);
    
    // Separate selected and unselected items
    const selectedItems = filtered.filter(r => selectedSet.has(r.symbol));
    const unselectedItems = filtered.filter(r => !selectedSet.has(r.symbol));
    
    // Sort each group alphabetically
    selectedItems.sort((a, b) => a.symbol.localeCompare(b.symbol));
    unselectedItems.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    // Return selected items first, then unselected
    return [...selectedItems, ...unselectedItems];
  }, [data, search, selected]);

  const onToggle = useCallback((symbol) => {
    setSelected((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, symbol];
    });
  }, []);

  const onClear = useCallback(() => setSelected([]), []);
  
  const handleCompare = useCallback(() => {
    setIsModalVisible(true);
  }, []);
  
  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSearch('');
  }, []);
  
  const handleDone = useCallback(() => {
    if (selected.length > 0) {
      setIsModalVisible(false);
      setSearch('');
    } else {
      Alert.alert('No ETFs Selected', 'Please select at least one ETF to compare.');
    }
  }, [selected]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  }, []);

  const handleAddToWatchlist = useCallback(async (symbol) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add ETFs to your watchlist.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Watchlist') }
        ]
      );
      return;
    }

    setLoadingSymbols(prev => new Set(prev).add(symbol));
    try {
      const etf = data.find(e => e.symbol === symbol);
      const price = pricesData[symbol];
      
      await addToWatchlist(symbol, {
        details: etf?.details,
        currentPrice: price?.currentPrice || etf?.lastClosePrice,
        changePercent: price?.changePercent,
        volume: price?.volume || etf?.lastDayVolume
      });
      
      Alert.alert('Success', `${getDisplaySymbol(symbol)} added to watchlist!`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      Alert.alert('Error', 'Failed to add ETF to watchlist. Please try again.');
    } finally {
      setLoadingSymbols(prev => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }
  }, [data, pricesData, addToWatchlist, user, navigation]);

  const selectedData = useMemo(() => {
    const map = new Map(data.map((r) => [r.symbol, r]));
    return selected.map((s) => ({ symbol: s, row: map.get(s) || null }));
  }, [data, selected]);

  // Calculate performance indicators for each metric
  const getPerformanceIndicator = useCallback((metricKey, value, allValues) => {
    if (value == null || allValues.length === 0) return null;
    
    const validValues = allValues.filter(v => v != null);
    if (validValues.length === 0) return null;
    
    const sorted = [...validValues].sort((a, b) => a - b);
    const isDescending = ['changePercent', 'weeklyReturn', 'monthlyReturn', 'yearlyReturn', 'twoYearReturn'].includes(metricKey);
    
    if (isDescending) {
      // For returns, higher is better
      if (value === sorted[sorted.length - 1]) return 'best';
      if (value === sorted[0]) return 'worst';
    } else {
      // For RSI and down from high, middle values are better
      if (value === sorted[sorted.length - 1]) return 'worst';
      if (value === sorted[0]) return 'best';
    }
    
    return null;
  }, []);

  const handleNavigateToDetail = useCallback((symbol) => {
    navigation.navigate('ETFDetail', { symbol });
  }, [navigation]);

  // Prepare chart data for visualization
  const chartData = useMemo(() => {
    if (selectedData.length === 0) return null;

    // Use abbreviated labels to prevent overlap
    const labels = selectedData.map(({ symbol }) => {
      const displaySymbol = getDisplaySymbol(symbol);
      // Shorten long labels for better fit
      if (displaySymbol.length > 10) {
        return displaySymbol.substring(0, 9) + '..';
      }
      return displaySymbol;
    });
    const fullLabels = selectedData.map(({ symbol }) => getDisplaySymbol(symbol));
    const colorsList = [
      '#5b9bfd', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
    ];

    // Returns data (1W, 1M, 1Y, 2Y)
    const returnsData = {
      weekly: selectedData.map(({ row }) => row?.weeklyReturn ?? 0),
      monthly: selectedData.map(({ row }) => row?.monthlyReturn ?? 0),
      yearly: selectedData.map(({ row }) => row?.yearlyReturn ?? 0),
      twoYear: selectedData.map(({ row }) => row?.twoYearReturn ?? 0),
    };

    // RSI data
    const rsiData = {
      daily: selectedData.map(({ row }) => row?.dailyRSI ?? 0),
      weekly: selectedData.map(({ row }) => row?.weeklyRSI ?? 0),
      monthly: selectedData.map(({ row }) => row?.monthlyRSI ?? 0),
    };

    // Price and change data
    const priceData = selectedData.map(({ row }) => row?.lastClosePrice ?? 0);
    const changeData = selectedData.map(({ row }) => row?.changePercent ?? 0);
    const volumeData = selectedData.map(({ row }) => row?.lastDayVolume ?? 0);

    return {
      labels,
      fullLabels,
      colorsList,
      returnsData,
      rsiData,
      priceData,
      changeData,
      volumeData,
    };
  }, [selectedData]);

  // Chart configurations using app theme
  const getChartConfig = useCallback((colorScheme = 'primary') => {
    const colorSchemes = {
      primary: {
        from: colors.primary,
        to: colors.primaryLight,
        accent: colors.primary,
      },
      success: {
        from: colors.success,
        to: colors.positive,
        accent: colors.success,
      },
      warning: {
        from: colors.warning,
        to: '#d97706',
        accent: colors.warning,
      },
      info: {
        from: colors.info,
        to: '#0891b2',
        accent: colors.info,
      },
    };

    const scheme = colorSchemes[colorScheme] || colorSchemes.primary;

    return {
      backgroundColor: colors.surface,
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surfaceSecondary,
      backgroundGradientFromOpacity: 1,
      backgroundGradientToOpacity: 1,
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(91, 155, 253, ${opacity})`,
      labelColor: (opacity = 1) => {
        const rgb = colors.text === '#f1f5f9' ? '241, 245, 249' : '31, 41, 55';
        return `rgba(${rgb}, ${opacity})`;
      },
      style: {
        borderRadius: 16,
      },
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: colors.border,
        strokeWidth: 1,
      },
      propsForLabels: {
        fontSize: 9,
        fontWeight: '600',
      },
      propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: scheme.accent,
      },
      fillShadowGradient: scheme.accent,
      fillShadowGradientOpacity: 0.3,
      barPercentage: 0.6,
    };
  }, [colors]);

  // Render Performance Overview with Progress Circles
  const renderPerformanceOverview = () => {
    if (!chartData) return null;

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="analytics" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>Performance Overview</Text>
        </LinearGradient>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.performanceScroll}
          contentContainerStyle={styles.performanceScrollContent}
        >
          {selectedData.map(({ symbol, row }, index) => {
            if (!row) return null;
            
            const weeklyReturn = row.weeklyReturn || 0;
            const monthlyReturn = row.monthlyReturn || 0;
            const yearlyReturn = row.yearlyReturn || 0;
            const isLastCard = index === selectedData.length - 1;

            return (
              <View 
                key={symbol} 
                style={[
                  styles.performanceCard, 
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isLastCard && styles.performanceCardLast
                ]}
              >
                <View style={styles.performanceHeader}>
                  <View style={[styles.etfBadge, { backgroundColor: chartData.colorsList[index] }]}>
                    <Text style={[styles.etfBadgeText, { color: colors.text }]}>{getDisplaySymbol(symbol)}</Text>
                  </View>
                  <Text style={[styles.performancePrice, { color: colors.text }]}>
                    ₹{row.lastClosePrice?.toFixed(2) || '—'}
                  </Text>
                </View>

                <View style={styles.returnsGrid}>
                  <View style={styles.returnItem}>
                    <Text style={[styles.returnPeriod, { color: colors.textSecondary }]}>1W</Text>
                    <Text style={[
                      styles.returnValue,
                      { color: weeklyReturn >= 0 ? colors.positive : colors.negative }
                    ]}>
                      {weeklyReturn >= 0 ? '+' : ''}{weeklyReturn?.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.returnItem}>
                    <Text style={[styles.returnPeriod, { color: colors.textSecondary }]}>1M</Text>
                    <Text style={[
                      styles.returnValue,
                      { color: monthlyReturn >= 0 ? colors.positive : colors.negative }
                    ]}>
                      {monthlyReturn >= 0 ? '+' : ''}{monthlyReturn?.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.returnItem}>
                    <Text style={[styles.returnPeriod, { color: colors.textSecondary }]}>1Y</Text>
                    <Text style={[
                      styles.returnValue,
                      { color: yearlyReturn >= 0 ? colors.positive : colors.negative }
                    ]}>
                      {yearlyReturn >= 0 ? '+' : ''}{yearlyReturn?.toFixed(2)}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.rsiIndicator, { borderTopColor: colors.border }]}>
                  <Text style={[styles.rsiLabel, { color: colors.textSecondary }]}>RSI (Daily)</Text>
                  <View style={[styles.rsiBar, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={[styles.rsiBarFill, { 
                      width: `${row.dailyRSI || 0}%`,
                      backgroundColor: row.dailyRSI > 70 ? colors.rsiOverbought : row.dailyRSI < 30 ? colors.rsiOversold : colors.warning
                    }]} />
                  </View>
                  <Text style={[styles.rsiValue, { color: colors.text }]}>
                    {row.dailyRSI?.toFixed(0) || '—'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Returns Comparison with Line Chart
  const renderReturnsChart = () => {
    if (!chartData) return null;

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.success, colors.positive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="trending-up" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>Returns Comparison</Text>
        </LinearGradient>

        <View style={[styles.chartWrapper, { backgroundColor: colors.surface }]}>
          <View style={[styles.periodTabs, { backgroundColor: colors.surfaceSecondary }]}>
            {[
              { key: 'weekly', label: '1W', color: colors.success },
              { key: 'monthly', label: '1M', color: colors.primary },
              { key: 'yearly', label: '1Y', color: colors.warning },
              { key: 'twoYear', label: '2Y', color: colors.info },
            ].map((period, idx) => (
              <View key={period.key} style={styles.periodTab}>
                <View style={[styles.periodIndicator, { backgroundColor: period.color }]} />
                <Text style={[styles.periodLabel, { color: colors.text }]}>
                  {period.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.returnsData.weekly,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.returnsData.monthly,
                    color: (opacity = 1) => `rgba(91, 155, 253, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.returnsData.yearly,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.returnsData.twoYear,
                    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
                legend: ['1W', '1M', '1Y', '2Y'],
              }}
              width={screenWidth - 80}
              height={280}
              yAxisSuffix="%"
              chartConfig={getChartConfig('success')}
              bezier
              style={styles.modernChart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withShadow={false}
              withDots={true}
              fromZero
              segments={5}
            />
          </View>

          <View style={[styles.chartInsight, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              Track performance across multiple time periods
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render RSI Comparison with Line Chart
  const renderRSIChart = () => {
    if (!chartData) return null;

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.warning, '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="pulse" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>RSI Indicators</Text>
        </LinearGradient>

        <View style={[styles.chartWrapper, { backgroundColor: colors.surface }]}>
          <View style={[styles.rsiLegend, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.rsiZone}>
              <View style={[styles.rsiZoneIndicator, { backgroundColor: colors.rsiOverbought }]} />
              <Text style={[styles.rsiZoneText, { color: colors.text }]}>Overbought (70+)</Text>
            </View>
            <View style={styles.rsiZone}>
              <View style={[styles.rsiZoneIndicator, { backgroundColor: colors.rsiOversold }]} />
              <Text style={[styles.rsiZoneText, { color: colors.text }]}>Oversold (&lt;30)</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.rsiData.daily,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.rsiData.weekly,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.rsiData.monthly,
                    color: (opacity = 1) => `rgba(91, 155, 253, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
                legend: ['Daily', 'Weekly', 'Monthly'],
              }}
              width={screenWidth - 80}
              height={280}
              chartConfig={getChartConfig('warning')}
              bezier
              style={styles.modernChart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withShadow={false}
              withDots={true}
              fromZero
              yAxisLabel=""
              segments={4}
            />
          </View>

          <View style={[styles.chartInsight, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              RSI values indicate overbought (&gt;70) or oversold (&lt;30) conditions
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Price Comparison Chart
  const renderPriceChart = () => {
    if (!chartData) return null;

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="cash" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>Price Comparison</Text>
        </LinearGradient>

        <View style={[styles.chartWrapper, { backgroundColor: colors.surface }]}>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.priceData,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={280}
              yAxisLabel="₹"
              chartConfig={getChartConfig('primary')}
              style={styles.modernChart}
              showValuesOnTopOfBars
              fromZero
              segments={4}
            />
          </View>
          
          {/* Full labels below chart */}
          <View style={styles.chartLabelsContainer}>
            {chartData.fullLabels.map((label, index) => (
              <View key={index} style={styles.chartLabelItem}>
                <View style={[styles.chartLabelDot, { backgroundColor: chartData.colorsList[index] }]} />
                <Text style={[styles.chartLabelText, { color: colors.text }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.priceStats, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
              <Text style={[styles.statValue, { color: colors.positive }]}>
                ₹{Math.max(...chartData.priceData).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lowest</Text>
              <Text style={[styles.statValue, { color: colors.negative }]}>
                ₹{Math.min(...chartData.priceData).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ₹{(chartData.priceData.reduce((a, b) => a + b, 0) / chartData.priceData.length).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render Daily Change % Chart
  const renderChangeChart = () => {
    if (!chartData) return null;

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.info, '#0891b2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="stats-chart" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>Daily Performance</Text>
        </LinearGradient>

        <View style={[styles.chartWrapper, { backgroundColor: colors.surface }]}>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.changeData,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={280}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={getChartConfig('info')}
              style={styles.modernChart}
              showValuesOnTopOfBars
              segments={4}
            />
          </View>
          
          {/* Full labels below chart */}
          <View style={styles.chartLabelsContainer}>
            {chartData.fullLabels.map((label, index) => (
              <View key={index} style={styles.chartLabelItem}>
                <View style={[styles.chartLabelDot, { backgroundColor: chartData.colorsList[index] }]} />
                <Text style={[styles.chartLabelText, { color: colors.text }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.performanceGrid}>
            {selectedData.map(({ symbol, row }, index) => {
              if (!row) return null;
              const change = row.changePercent || 0;
              const isPositive = change >= 0;
              
              return (
                <View key={symbol} style={[styles.performanceTile, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.tileSymbol, { color: colors.text }]}>
                    {getDisplaySymbol(symbol)}
                  </Text>
                  <View style={styles.tileChange}>
                    <Ionicons 
                      name={isPositive ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={isPositive ? colors.positive : colors.negative} 
                    />
                    <Text style={[
                      styles.tileChangeValue,
                      { color: isPositive ? colors.positive : colors.negative }
                    ]}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Render Volume Comparison Chart
  const renderVolumeChart = () => {
    if (!chartData) return null;

    // Format volume for display (in millions or thousands)
    const maxVolume = Math.max(...chartData.volumeData.filter(v => !isNaN(v) && isFinite(v)), 0);
    let formattedVolume = chartData.volumeData;
    let suffix = '';
    
    if (maxVolume >= 1000000) {
      formattedVolume = chartData.volumeData.map((vol) => vol / 1000000);
      suffix = 'M';
    } else if (maxVolume >= 1000) {
      formattedVolume = chartData.volumeData.map((vol) => vol / 1000);
      suffix = 'K';
    }

    return (
      <View style={[styles.modernChartContainer, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.warning, '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Ionicons name="bar-chart" size={24} color={colors.text} />
          <Text style={[styles.modernChartTitle, { color: colors.text }]}>Trading Volume</Text>
        </LinearGradient>

        <View style={[styles.chartWrapper, { backgroundColor: colors.surface }]}>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: formattedVolume,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={280}
              yAxisLabel=""
              yAxisSuffix={suffix}
              chartConfig={getChartConfig('warning')}
              style={styles.modernChart}
              showValuesOnTopOfBars
              fromZero
              segments={4}
            />
          </View>
          
          {/* Full labels below chart */}
          <View style={styles.chartLabelsContainer}>
            {chartData.fullLabels.map((label, index) => (
              <View key={index} style={styles.chartLabelItem}>
                <View style={[styles.chartLabelDot, { backgroundColor: chartData.colorsList[index] }]} />
                <Text style={[styles.chartLabelText, { color: colors.text }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartInsight, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              Higher volume indicates stronger market interest and liquidity
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render all graphs
  const renderGraphs = () => {
    if (selected.length === 0) return null;

    return (
      <ScrollView 
        style={styles.graphsContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {renderPerformanceOverview()}
        {renderReturnsChart()}
        {renderChangeChart()}
        {renderPriceChart()}
        {renderRSIChart()}
        {renderVolumeChart()}
        
        <View style={styles.graphFooter}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Swipe to explore all visualizations
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Create a Set for O(1) lookup instead of O(n) with array.includes()
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const renderETFItem = useCallback(({ item }) => {
    const isSelected = selectedSet.has(item.symbol);
    const isDisabled = !isSelected && selected.length >= MAX_SELECTION;
    const inWatchlist = user ? isInWatchlist(item.symbol) : false;
    const isLoading = loadingSymbols.has(item.symbol);
    
    return (
      <ETFItem
        item={item}
        isSelected={isSelected}
        isDisabled={isDisabled}
        inWatchlist={inWatchlist}
        isLoading={isLoading}
        onToggle={onToggle}
        onNavigate={handleNavigateToDetail}
        onAddToWatchlist={user ? handleAddToWatchlist : null}
        colors={colors}
      />
    );
  }, [selectedSet, selected.length, loadingSymbols, user, isInWatchlist, onToggle, handleNavigateToDetail, handleAddToWatchlist, colors]);

  const renderETFRow = ({ item: { symbol, row }, index }) => {
    if (!row) return null;
    
    const isEvenRow = index % 2 === 0;
    
    return (
      <View style={[
        styles.etfDataRow, 
        { 
          borderBottomColor: colors.tableBorderLight,
          backgroundColor: isEvenRow ? colors.surface : colors.surfaceSecondary
        }
      ]}>
        <View style={[styles.etfSymbolContainer, { borderRightColor: colors.tableBorder, borderRightWidth: 1 }]}>
          <Text style={[styles.etfSymbolText, { color: colors.symbol, fontWeight: '600' }]}>
            {getDisplaySymbol(symbol)}
          </Text>
        </View>
        
        {METRICS.map((metric, metricIndex) => {
          const value = row[metric.key];
          const allValues = selectedData.map(({ row: r }) => r?.[metric.key]).filter(v => v != null);
          const performance = getPerformanceIndicator(metric.key, value, allValues);
          const isLastColumn = metricIndex === METRICS.length - 1;
          
          // Special handling for downFrom2YearHigh - it always displays as negative
          const isDownFromHigh = metric.key === 'downFrom2YearHigh';
          
          // Determine if value is negative or positive
          // For downFrom2YearHigh, always treat as negative since it's always displayed with negative sign
          const isNegative = value != null && (isDownFromHigh || value < 0);
          const isPositive = value != null && !isDownFromHigh && value > 0;
          const isPercentageMetric = metric.key === 'changePercent' || metric.key === 'weeklyReturn' || 
                                     metric.key === 'monthlyReturn' || metric.key === 'yearlyReturn' || 
                                     metric.key === 'twoYearReturn' || metric.key === 'downFrom2YearHigh';
          
          // Determine text color - red for negative, green for positive, default otherwise
          let textColor = colors.text;
          if (isNegative) {
            textColor = '#dc2626'; // Red for negative values
          } else if (isPositive && isPercentageMetric) {
            textColor = colors.positive || '#10b981'; // Green for positive percentage values
          }
          
          return (
            <View 
              key={`${symbol}-${metric.key}`} 
              style={[
                styles.metricValueContainer,
                { borderRightColor: colors.tableBorder, borderRightWidth: isLastColumn ? 0 : 1 }
              ]}
            >
              <Text style={[
                styles.metricValue, 
                { color: textColor },
                // Make all percentage values bold for maximum visibility
                isPercentageMetric && { fontWeight: '700' }
              ]}>
                {row ? (metric.render ? metric.render(row[metric.key], row) : (row[metric.key] ?? '—')) : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search ETF symbol"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      
      <View style={styles.selectionInfo}>
        <Text style={[styles.selectionText, { color: colors.text }]}>Selected: {selected.length}/{MAX_SELECTION}</Text>
        <TouchableOpacity 
          style={[
            styles.clearButton, 
            { backgroundColor: colors.surfaceSecondary },
            selected.length === 0 && { backgroundColor: colors.border }
          ]}
          onPress={onClear}
          disabled={selected.length === 0}
        >
          <Ionicons name="refresh" size={16} color={selected.length === 0 ? colors.textSecondary : colors.primary} />
          <Text style={[
            styles.clearButtonText, 
            { color: colors.text },
            selected.length === 0 && { color: colors.textSecondary }
          ]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Compare ETFs" />
        <LoadingSpinner size="large" text="Loading ETF data..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Compare ETFs" 
        rightButton={
          selected.length > 0 ? (
            <View style={[styles.headerToggle, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons 
                name="grid-outline" 
                size={18} 
                color={viewMode === 'table' ? colors.primary : colors.textSecondary} 
              />
              <Switch
                value={viewMode === 'graph'}
                onValueChange={(value) => setViewMode(value ? 'graph' : 'table')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
                ios_backgroundColor={colors.border}
                style={styles.headerSwitch}
              />
              <Ionicons 
                name="bar-chart-outline" 
                size={18} 
                color={viewMode === 'graph' ? colors.primary : colors.textSecondary} 
              />
            </View>
          ) : null
        }
      />
      
      <View style={styles.content}>
        {/* Compare button and selected ETFs info */}
        {selected.length === 0 ? (
          <View style={styles.initialStateContainer}>
            <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.initialStateTitle, { color: colors.text }]}>Compare ETFs</Text>
            <Text style={[styles.initialStateSubtitle, { color: colors.textSecondary }]}>
              Select up to {MAX_SELECTION} ETFs to compare their metrics side by side
            </Text>
            <TouchableOpacity
              style={[styles.compareButton, { backgroundColor: colors.primary }]}
              onPress={handleCompare}
            >
              <Ionicons name="stats-chart" size={16} color="#fff" />
              <Text style={styles.compareButtonText}>Compare ETFs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.selectedHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.selectedInfo}>
              <Text style={[styles.selectedCount, { color: colors.text }]}>
                Comparing {selected.length} ETF{selected.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={handleCompare}
              >
                <Ionicons name="create-outline" size={16} color="#ffffff" />
                <Text style={[styles.editButtonText, { color: '#ffffff' }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.clearSelectedButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClear}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.clearSelectedText, { color: colors.textSecondary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comparison table or graphs */}
        {selected.length > 0 && (
          viewMode === 'table' ? (
          <View style={[styles.compareTableSection, { backgroundColor: colors.surface }]}>
            <View style={styles.tableContainer}>
              {/* Fixed left column with ETF symbols */}
              <View style={[styles.fixedColumn, { backgroundColor: colors.surface }]}>
                {/* Fixed header */}
                <View style={[styles.fixedColumnHeader, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
                  <Text style={[styles.headerMetric, { color: colors.text, fontWeight: '700' }]}>ETF</Text>
                </View>
                
                {/* Fixed ETF symbols */}
                <FlatList
                  data={selectedData}
                  renderItem={({ item: { symbol }, index }) => {
                    const isEvenRow = index % 2 === 0;
                    return (
                      <View style={[
                        styles.fixedColumnCell,
                        { 
                          borderBottomColor: colors.tableBorderLight,
                          backgroundColor: isEvenRow ? colors.surface : colors.surfaceSecondary
                        }
                      ]}>
                        <Text style={[styles.etfSymbolText, { color: colors.symbol, fontWeight: '600' }]}>
                          {getDisplaySymbol(symbol)}
                        </Text>
                      </View>
                    );
                  }}
                  keyExtractor={(item) => item.symbol}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>

              {/* Scrollable metrics section */}
              <ScrollView 
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.horizontalScroll}
              >
                <View style={[styles.scrollableTable, { backgroundColor: colors.surface }]}>
                  {/* Header row with metric labels */}
                  <View style={[styles.tableHeader, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
                    {METRICS.map((metric, index) => {
                      const isLastColumn = index === METRICS.length - 1;
                      return (
                        <View 
                          key={metric.key} 
                          style={[
                            styles.headerMetricColumnContainer,
                            { borderRightColor: colors.tableBorder, borderRightWidth: isLastColumn ? 0 : 1 }
                          ]}
                        >
                          <Text style={[styles.headerMetricColumn, { color: colors.text, fontWeight: '600' }]}>
                            {metric.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  {/* ETF data rows */}
                  <FlatList
                    data={selectedData}
                    renderItem={({ item: { symbol, row }, index }) => {
                      if (!row) return null;
                      
                      const isEvenRow = index % 2 === 0;
                      
                      return (
                        <View style={[
                          styles.scrollableDataRow, 
                          { 
                            borderBottomColor: colors.tableBorderLight,
                            backgroundColor: isEvenRow ? colors.surface : colors.surfaceSecondary
                          }
                        ]}>
                          {METRICS.map((metric, metricIndex) => {
                            const value = row[metric.key];
                            const allValues = selectedData.map(({ row: r }) => r?.[metric.key]).filter(v => v != null);
                            const performance = getPerformanceIndicator(metric.key, value, allValues);
                            const isLastColumn = metricIndex === METRICS.length - 1;
                            
                            const isDownFromHigh = metric.key === 'downFrom2YearHigh';
                            const isNegative = value != null && (isDownFromHigh || value < 0);
                            const isPositive = value != null && !isDownFromHigh && value > 0;
                            const isPercentageMetric = metric.key === 'changePercent' || metric.key === 'weeklyReturn' || 
                                                       metric.key === 'monthlyReturn' || metric.key === 'yearlyReturn' || 
                                                       metric.key === 'twoYearReturn' || metric.key === 'downFrom2YearHigh';
                            
                            let textColor = colors.text;
                            if (isNegative) {
                              textColor = '#dc2626';
                            } else if (isPositive && isPercentageMetric) {
                              textColor = colors.positive || '#10b981';
                            }
                            
                            return (
                              <View 
                                key={`${symbol}-${metric.key}`} 
                                style={[
                                  styles.metricValueContainer,
                                  { borderRightColor: colors.tableBorder, borderRightWidth: isLastColumn ? 0 : 1 }
                                ]}
                              >
                                <Text style={[
                                  styles.metricValue, 
                                  { color: textColor },
                                  isPercentageMetric && { fontWeight: '700' }
                                ]}>
                                  {row ? (metric.render ? metric.render(row[metric.key], row) : (row[metric.key] ?? '—')) : '—'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }}
                    keyExtractor={(item) => item.symbol}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchData(true)}
                        tintColor={colors.primary}
                      />
                    }
                    ListEmptyComponent={
                      <View style={styles.emptyTableContainer}>
                        <Text style={[styles.emptyTableText, { color: colors.textSecondary }]}>
                          No ETFs selected for comparison
                        </Text>
                      </View>
                    }
                  />
                </View>
              </ScrollView>
            </View>
          </View>
          ) : (
            renderGraphs()
          )
        )}
      </View>

      {/* Ad Banner at bottom */}
      <View style={[styles.footerAdContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <AdMobBanner />
      </View>

      {/* Modal for ETF selection */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select ETFs to Compare
              </Text>
              <View style={styles.modalHeaderActions}>
                <Text style={[styles.modalSelectionCount, { color: colors.textSecondary }]}>
                  {selected.length}/{MAX_SELECTION}
                </Text>
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={handleModalClose}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search and selection info */}
            <View style={styles.modalBody}>
              {renderHeader()}
              
              <FlatList
                data={list}
                renderItem={renderETFItem}
                keyExtractor={(item) => item.symbol}
                style={styles.modalETFList}
                showsVerticalScrollIndicator={true}
                // Performance optimizations
                maxToRenderPerBatch={15}
                updateCellsBatchingPeriod={100}
                initialNumToRender={20}
                windowSize={5}
                // Don't use removeClippedSubviews or getItemLayout - they can cause scrolling issues
              />
            </View>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.modalDoneButton,
                  { backgroundColor: selected.length > 0 ? colors.primary : colors.border }
                ]}
                onPress={handleDone}
                disabled={selected.length === 0}
              >
                <Text style={[
                  styles.modalDoneButtonText,
                  { color: selected.length > 0 ? '#fff' : colors.textSecondary }
                ]}>
                  Compare {selected.length > 0 ? `(${selected.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {errorMessage}</Text>
        </View>
      )}
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
  selectPanel: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  collapsedPanel: {
    maxHeight: 60,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  panelContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#5b9bfd',
  },
  disabledText: {
    color: '#9ca3af',
  },
  etfList: {
    maxHeight: 200,
  },
  etfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedETFItem: {
    backgroundColor: '#eff6ff',
  },
  etfItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  etfSymbol: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  etfItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareTableSection: {
    flex: 1,
    padding: 12,
  },
  tableContainer: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedColumn: {
    zIndex: 10,
    borderRightWidth: .5,
    borderRightColor: '#e5e7eb',
  },
  fixedColumnHeader: {
    width: 120,
    height: 47, // Exact height: 10 (paddingVertical) * 2 + 25 (content) + 2 (borderBottom)
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  fixedColumnCell: {
    width: 120,
    height: 46, // Exact height: 10 (paddingVertical) * 2 + 25 (content) + 1 (borderBottom)
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  horizontalScroll: {
    flex: 1,
  },
  scrollableTable: {
    backgroundColor: '#fff',
  },
  scrollableDataRow: {
    flexDirection: 'row',
    height: 46, // Exact height to match fixedColumnCell
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  compareTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    height: 47, // Exact height to match fixedColumnHeader
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  headerMetricContainer: {
    width: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerMetric: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
  },
  headerMetricColumnContainer: {
    width: 100,
    height: 47, // Match header height
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerMetricColumnContainerLast: {
    borderRightWidth: 0,
  },
  headerMetricColumn: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionButton: {
    padding: 4,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etfDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 45,
    alignItems: 'center',
  },
  etfSymbolContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  etfSymbolText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b9bfd',
    letterSpacing: 0.3,
  },
  sortIndicator: {
    padding: 2,
  },
  metricValueContainer: {
    width: 100,
    height: 46, // Match row height
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  metricValueContainerLast: {
    borderRightWidth: 0,
  },
  metricValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    minHeight: 20,
  },
  metricValue: {
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyTableContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 16,
    textAlign: 'center',
  },
  performanceIcon: {
    marginLeft: 4,
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  hintText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  hintSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  initialStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  initialStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectedCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  clearSelectedText: {
    fontSize: 14,
  },
  graphsContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  graphFooter: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Modern Chart Styles
  modernChartContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  modernChartTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartWrapper: {
    padding: 20,
    paddingBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLabelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  chartLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 155, 253, 0.1)',
    gap: 6,
    minWidth: '28%',
    maxWidth: '48%',
  },
  chartLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLabelText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  chartInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  // Performance Overview Styles
  performanceScroll: {
    paddingVertical: 16,
  },
  performanceScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  performanceCard: {
    width: 200,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  performanceCardLast: {
    marginRight: 0,
  },
  performanceHeader: {
    marginBottom: 16,
  },
  etfBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  etfBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  performancePrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  returnsGrid: {
    marginBottom: 16,
  },
  returnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  returnPeriod: {
    fontSize: 12,
    fontWeight: '600',
  },
  returnValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rsiIndicator: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  rsiLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  rsiBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  rsiBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rsiValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  // Period Tabs
  periodTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  periodTab: {
    alignItems: 'center',
    gap: 6,
  },
  periodIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // RSI Legend
  rsiLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  rsiZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rsiZoneIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  rsiZoneText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Price Stats
  priceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  // Performance Grid
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  performanceTile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
  },
  tileSymbol: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  tileChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileChangeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalSelectionCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalETFList: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalDoneButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerAdContainer: {
    // paddingVertical: 12,
    paddingHorizontal: 8,
    // borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CompareScreen;
