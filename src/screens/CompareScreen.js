import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from 'react-native';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheUtils } from '../utils/cache';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters, renderDownFromHigh } from '../utils/helpers';
import { getDisplaySymbol, getFullSymbol } from '../utils/symbolUtils';
import { getETFCategory } from '../data/etfDescriptions';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

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
  
  const scrollViewRef = useRef(null);

  const MAX_SELECTION = 6;

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

      // Load both summary and prices data together to avoid race conditions
      let summaryData = await cacheUtils.getCachedData();
      let pricesData = await cacheUtils.getCachedPrices();

      // If no summary cached, fetch it
      if (!summaryData) {
        try {
          const resp = await fetch(SUMMARY_API_URL, { 
            method: 'GET', 
            headers: { 'Accept': 'application/json' }, 
            mode: 'cors' 
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          summaryData = await resp.json();
          await cacheUtils.setCachedData(summaryData);
        } catch (err) {
          throw err;
        }
      }

      // Check if prices cache is valid, if not fetch fresh prices
      const isPricesCacheValid = await cacheUtils.isPricesCacheValid();
      if (!pricesData || !isPricesCacheValid) {
        try {
          const resp = await fetch(PRICES_API_URL);
          if (resp.ok) {
            const pricesArray = await resp.json();
            const freshPricesData = pricesArray.reduce((acc, item) => {
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
            if (Object.keys(freshPricesData).length > 0) {
              pricesData = freshPricesData;
              await cacheUtils.setCachedPrices(pricesData);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch prices, using cached data if available:', error);
        }
      }

      // Only render when we have both summary and prices data
      if (summaryData && pricesData) {
        setPricesData(pricesData);
        setData(processRawData(summaryData, pricesData));
      } else if (summaryData) {
        // Fallback: render with summary only if prices fail
        setPricesData(pricesData ?? {});
        setData(processRawData(summaryData, pricesData ?? {}));
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
    
    // Separate selected and unselected items
    const selectedItems = filtered.filter(r => selected.includes(r.symbol));
    const unselectedItems = filtered.filter(r => !selected.includes(r.symbol));
    
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

  const renderETFItem = ({ item }) => {
    const isSelected = selected.includes(item.symbol);
    const isDisabled = !isSelected && selected.length >= MAX_SELECTION;
    const inWatchlist = isInWatchlist(item.symbol);
    const isLoading = loadingSymbols.has(item.symbol);
    
    return (
      <View style={[
        styles.etfItem, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelected && { backgroundColor: colors.tableRowSelected }
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
            { color: colors.text },
            isDisabled && { color: colors.textSecondary }
          ]}>
            {getDisplaySymbol(item.symbol)}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.etfItemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => navigation.navigate('ETFDetail', { symbol: item.symbol })}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          {!inWatchlist && user && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => handleAddToWatchlist(item.symbol)}
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
  };

  const renderETFRow = ({ item: { symbol, row } }) => {
    if (!row) return null;
    
    return (
      <View style={[styles.etfDataRow, { borderBottomColor: colors.tableBorderLight }]}>
        <View style={styles.etfSymbolContainer}>
          <Text style={[styles.etfSymbolText, { color: colors.primary, fontWeight: '600' }]}>
            {getDisplaySymbol(symbol)}
          </Text>
        </View>
        
        {METRICS.map((metric) => {
          const value = row[metric.key];
          const allValues = selectedData.map(({ row: r }) => r?.[metric.key]).filter(v => v != null);
          const performance = getPerformanceIndicator(metric.key, value, allValues);
          
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
            <View key={`${symbol}-${metric.key}`} style={styles.metricValueContainer}>
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
      <Header title="Compare ETFs" />
      
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
              <Ionicons name="stats-chart" size={20} color="#fff" />
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
                style={[styles.editButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={handleCompare}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.clearSelectedButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClear}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.clearSelectedText, { color: colors.textSecondary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comparison table */}
        {selected.length > 0 && (
          <View style={[styles.compareTableSection, { backgroundColor: colors.surface }]}>
            <ScrollView 
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.horizontalScroll}
            >
              <View style={[styles.compareTable, { backgroundColor: colors.surface, minWidth: Math.max(600, METRICS.length * 120 + 150) }]}>
                {/* Header row with "Metric" and all metric labels as columns */}
                <View style={[styles.tableHeader, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
                  <View style={styles.headerMetricContainer}>
                    <Text style={[styles.headerMetric, { color: colors.text, fontWeight: '700' }]}>Metric</Text>
                  </View>
                  {METRICS.map((metric) => (
                    <View key={metric.key} style={styles.headerMetricColumnContainer}>
                      <Text style={[styles.headerMetricColumn, { color: colors.text, fontWeight: '600' }]}>
                        {metric.label}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* ETF rows - each ETF as a row with its values */}
                <FlatList
                  data={selectedData}
                  renderItem={renderETFRow}
                  keyExtractor={(item) => item.symbol}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={() => fetchData(true)}
                      tintColor={colors.primary}
                    />
                  }
                />
              </View>
            </ScrollView>
          </View>
        )}
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
    color: '#2563eb',
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
    padding: 16,
  },
  horizontalScroll: {
    flex: 1,
  },
  compareTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 400,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  headerMetricContainer: {
    width: 150,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerMetric: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  headerMetricColumnContainer: {
    width: 120,
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerMetricColumn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 50,
  },
  etfSymbolContainer: {
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  etfSymbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  sortIndicator: {
    padding: 2,
  },
  metricValueContainer: {
    width: 120,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metricValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 24,
  },
  metricValue: {
    fontSize: 14,
    color: '#1f2937',
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  clearSelectedText: {
    fontSize: 14,
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
});

export default CompareScreen;
