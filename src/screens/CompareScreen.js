import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheUtils } from '../utils/cache';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters, renderDownFromHigh } from '../utils/helpers';
import { getDisplaySymbol } from '../utils/symbolUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const CompareScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  const { symbols } = route.params || {};
  
  const [data, setData] = useState([]);
  const [pricesData, setPricesData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'changePercent', dir: 'desc' });
  
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
    { key: 'recordDate', label: 'Record Date', sortable: false },
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
        recordDate: details.recordDate ?? '',
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

      // Try cached summary first
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

      // Prices: use cached prices if available and valid; otherwise fetch
      if (!pricesData || !(await cacheUtils.isPricesCacheValid())) {
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
        } catch {
          // keep cached prices if present
        }
      }

      setPricesData(pricesData ?? {});
      setData(processRawData(summaryData ?? [], pricesData ?? {}));
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
    setSearch('');
  }, []);

  const onClear = useCallback(() => setSelected([]), []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  }, []);

  const handleAddToWatchlist = useCallback(async (symbol) => {
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
    }
  }, [data, pricesData, addToWatchlist]);

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
          
          {!inWatchlist && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => handleAddToWatchlist(item.symbol)}
            >
              <Ionicons name="star-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMetricRow = ({ item: metric }) => {
    const allValues = selectedData.map(({ row }) => row?.[metric.key]).filter(v => v != null);
    
    return (
      <View style={[styles.metricRow, { borderBottomColor: colors.tableBorderLight }]}>
        <View style={styles.metricLabelContainer}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>{metric.label}</Text>
        </View>
        
        {selectedData.map(({ symbol, row }) => {
          const value = row?.[metric.key];
          const performance = getPerformanceIndicator(metric.key, value, allValues);
          
          return (
            <View key={`${metric.key}-${symbol}`} style={styles.metricValueContainer}>
              <Text style={[
                styles.metricValue, 
                { color: colors.text },
                // Make all percentage values bold for maximum visibility
                (metric.key === 'changePercent' || metric.key === 'weeklyReturn' || 
                 metric.key === 'monthlyReturn' || metric.key === 'yearlyReturn' || 
                 metric.key === 'twoYearReturn' || metric.key === 'downFrom2YearHigh') && { fontWeight: '700' },
                // Add colors for positive and negative percentage values
                metric.key === 'changePercent' && row?.changePercent > 0 && { color: colors.positive },
                metric.key === 'changePercent' && row?.changePercent < 0 && { color: colors.negative },
                metric.key === 'weeklyReturn' && row?.weeklyReturn > 0 && { color: colors.positive },
                metric.key === 'weeklyReturn' && row?.weeklyReturn < 0 && { color: colors.negative },
                metric.key === 'monthlyReturn' && row?.monthlyReturn > 0 && { color: colors.positive },
                metric.key === 'monthlyReturn' && row?.monthlyReturn < 0 && { color: colors.negative },
                metric.key === 'yearlyReturn' && row?.yearlyReturn > 0 && { color: colors.positive },
                metric.key === 'yearlyReturn' && row?.yearlyReturn < 0 && { color: colors.negative },
                metric.key === 'twoYearReturn' && row?.twoYearReturn > 0 && { color: colors.positive },
                metric.key === 'twoYearReturn' && row?.twoYearReturn < 0 && { color: colors.negative }
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
        {/* Selection panel */}
        <View style={[styles.selectPanel, isPanelCollapsed && styles.collapsedPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.panelHeader, { borderBottomColor: colors.border }]}
            onPress={() => setIsPanelCollapsed(!isPanelCollapsed)}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              {selected.length > 0 
                ? `${selected.length} ETFs selected`
                : "Select ETFs to compare"
              }
            </Text>
            <Ionicons 
              name={isPanelCollapsed ? 'chevron-down' : 'chevron-up'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {!isPanelCollapsed && (
            <View style={styles.panelContent}>
              {renderHeader()}
              
              <FlatList
                data={list}
                renderItem={renderETFItem}
                keyExtractor={(item) => item.symbol}
                style={styles.etfList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Comparison table */}
        <View style={[styles.compareTableSection, { backgroundColor: colors.surface }]}>
          {selected.length > 0 ? (
            <ScrollView 
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.horizontalScroll}
            >
              <View style={[styles.compareTable, { backgroundColor: colors.surface, minWidth: Math.max(400, selected.length * 120 + 200) }]}>
                {/* Header row */}
                <View style={[styles.tableHeader, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
                  <Text style={[styles.headerMetric, { color: colors.text }]}>Metric</Text>
                  {selectedData.map(({ symbol }) => (
                    <View key={symbol} style={styles.headerSymbolContainer}>
                      <Text style={[styles.headerSymbol, { color: colors.primary }]}>
                        {getDisplaySymbol(symbol)}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* Metric rows */}
                <FlatList
                  data={METRICS}
                  renderItem={renderMetricRow}
                  keyExtractor={(item) => item.key}
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
          ) : (
            <View style={styles.hintContainer}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>Select up to {MAX_SELECTION} ETFs to compare</Text>
              <Text style={[styles.hintSubtext, { color: colors.textSecondary }]}>
                Use the search above to find and select ETFs for detailed comparison
              </Text>
            </View>
          )}
        </View>
      </View>
      
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
  headerMetric: {
    width: 150,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    alignSelf: 'center',
  },
  headerSymbolContainer: {
    width: 120,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
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
  metricRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 50,
  },
  metricLabelContainer: {
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
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
});

export default CompareScreen;
