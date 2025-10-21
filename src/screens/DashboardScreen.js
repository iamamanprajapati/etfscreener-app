import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheUtils } from '../utils/cache';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters } from '../utils/helpers';
import { getDisplaySymbol } from '../utils/symbolUtils';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('Loading ETF data...');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'changePercent', dir: 'desc' });
  const [selectedColumn, setSelectedColumn] = useState('currentPrice');
  
  // Refs for scroll synchronization
  const fixedColumnScrollRef = useRef(null);
  const dataColumnsScrollRef = useRef(null);
  const isScrolling = useRef(false);

  // Scroll synchronization functions
  const handleFixedColumnScroll = (event) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const offsetY = event.nativeEvent.contentOffset.y;
    if (dataColumnsScrollRef.current) {
      dataColumnsScrollRef.current.scrollTo({ y: offsetY, animated: false });
    }
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 10);
  };

  const handleDataColumnsScroll = (event) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const offsetY = event.nativeEvent.contentOffset.y;
    if (fixedColumnScrollRef.current) {
      fixedColumnScrollRef.current.scrollTo({ y: offsetY, animated: false });
    }
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 10);
  };

  // Column configuration - matching web app exactly with specific widths
  const COLUMNS = [
    { key: 'symbol', label: 'Symbol', numeric: false, sticky: true, width: 120 },
    { key: 'currentPrice', label: 'Current Price', numeric: true, render: formatters.price, width: 100 },
    { key: 'changePercent', label: 'Change %', numeric: true, render: formatters.percent, width: 100 },
    { key: 'lastDayVolume', label: 'Volume', numeric: true, render: formatters.number, width: 120 },
    { key: 'dailyRSI', label: 'RSI (D)', numeric: true, render: formatters.rsi, width: 80 },
    { key: 'weeklyRSI', label: 'RSI (W)', numeric: true, render: formatters.rsi, width: 80 },
    { key: 'monthlyRSI', label: 'RSI (M)', numeric: true, render: formatters.rsi, width: 80 },
    { key: 'weeklyReturn', label: '1W %', numeric: true, render: formatters.percent, width: 80 },
    { key: 'monthlyReturn', label: '1M %', numeric: true, render: formatters.percent, width: 80 },
    { key: 'yearlyReturn', label: '1Y %', numeric: true, render: formatters.percent, width: 80 },
    { key: 'twoYearReturn', label: '2Y %', numeric: true, render: formatters.percent, width: 80 },
  ];

  // Data processing function
  const processRawData = (summaryData, pricesData = {}) => {
    return summaryData.map((row) => {
      const details = row.details ?? {};
      const symbol = row.symbol ?? '—';
      const priceInfo = pricesData[symbol] || {};
      
      const currentPrice = priceInfo.currentPrice || priceInfo.price || priceInfo.lastPrice || priceInfo.current;
      const changePercent = priceInfo.changePercent || priceInfo.change || priceInfo.percentChange || priceInfo.changePct;

      return {
        symbol,
        currentPrice: parseNumber(currentPrice),
        changePercent: parseNumber(changePercent),
        lastDayVolume: parseNumber(details.lastDayVolume),
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

  // Fetch data effect with caching
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage('');

      // Load both summary and prices data together to avoid race conditions
      setLoadingStatus('Loading ETF summary data...');
      let summaryData = await cacheUtils.getCachedData();
      
      // If no summary cached, fetch it
      if (!summaryData) {
        setLoadingStatus('Fetching ETF summary from server...');
        const summaryResp = await fetch(SUMMARY_API_URL, { headers: { 'Accept': 'application/json' } });
        if (!summaryResp.ok) throw new Error(`HTTP ${summaryResp.status}: ${summaryResp.statusText}`);
        summaryData = await summaryResp.json();
        await cacheUtils.setCachedData(summaryData);
      }

      setLoadingStatus('Loading price data...');
      let pricesData = await cacheUtils.getCachedPrices();

      // Check if prices cache is valid, if not fetch fresh prices
      const isPricesCacheValid = await cacheUtils.isPricesCacheValid();
      if (!pricesData || !isPricesCacheValid) {
        setLoadingStatus('Fetching latest prices...');
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

      setLoadingStatus('Processing data...');

      // Only render when we have both summary and prices data
      if (summaryData && pricesData) {
        setTableData(processRawData(summaryData, pricesData));
      } else if (summaryData) {
        // Fallback: render with summary only if prices fail
        setTableData(processRawData(summaryData, {}));
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

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = tableData;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(row => 
        row.symbol.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const aIsNull = aValue == null || aValue === '';
      const bIsNull = bValue == null || bValue === '';
      
      if (aIsNull && !bIsNull) return 1;
      if (!aIsNull && bIsNull) return -1;
      if (aIsNull && bIsNull) return 0;
      
      const multiplier = sortConfig.dir === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }
      
      return String(aValue).localeCompare(String(bValue)) * multiplier;
    });
    
    return sorted;
  }, [tableData, searchQuery, sortConfig]);

  // Event handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }, []);

  const handleColumnSelect = useCallback((key) => {
    setSelectedColumn(key);
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setSortConfig({ key: 'changePercent', dir: 'desc' });
  }, []);

  const handleRowPress = useCallback((symbol) => {
    navigation.navigate('ETFDetail', { symbol });
  }, [navigation]);

  // Get visible columns only
  const visibleColumns = useMemo(() => {
    return COLUMNS.filter(col => !col.hidden);
  }, []);


  // Calculate scrollable columns width (excluding symbol column)
  const scrollableColumnsWidth = useMemo(() => {
    const scrollableColumns = visibleColumns.filter(col => col.key !== 'symbol');
    return scrollableColumns.reduce((total, col) => total + col.width, 0);
  }, [visibleColumns]);





  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by ETF symbol..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>
      
      <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.surfaceSecondary }]} onPress={handleReset}>
        <Ionicons name="refresh" size={16} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.primary }]}>Reset</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="ETF Dashboard" />
        <LoadingSpinner size="large" text={loadingStatus} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="ETF Dashboard" />
      
      <View style={[styles.tableContainer, { backgroundColor: colors.background }]}>
        {renderHeader()}
        
        <View style={[styles.tableWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Fixed Symbol Column */}
          <View style={[styles.fixedColumn, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
            {/* Fixed Symbol Header */}
            <View style={[styles.fixedHeaderCell, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
              <TouchableOpacity
                style={[styles.headerContent, { backgroundColor: colors.tableHeader }]}
                onPress={() => {
                  handleSort('symbol');
                  handleColumnSelect('symbol');
                }}
              >
                <Text style={[styles.headerText, { color: colors.text }]}>
                  Symbol
                </Text>
                <Text style={[styles.sortIndicator, { color: colors.textSecondary }]}>
                  {sortConfig.key === 'symbol' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Fixed Symbol Rows */}
            <ScrollView 
              ref={fixedColumnScrollRef}
              showsVerticalScrollIndicator={false}
              style={styles.fixedColumnScroll}
              onScroll={handleFixedColumnScroll}
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => fetchData(true)}
                  tintColor={colors.primary}
                />
              }
            >
              {processedData.length === 0 ? (
                <View style={[styles.emptyState, { height: 200 }]}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {isLoading ? 'Loading...' : 'No ETFs match your search.'}
                  </Text>
                </View>
              ) : (
                processedData.map((item) => (
                  <View key={item.symbol} style={[styles.fixedRowCell, { backgroundColor: colors.tableRow, borderBottomColor: colors.tableBorderLight }]}>
                    <TouchableOpacity
                      style={styles.symbolButton}
                      onPress={() => handleRowPress(item.symbol)}
                    >
                      <Text style={[styles.symbolText, { color: colors.primary }]}>{getDisplaySymbol(item.symbol)}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
          
          {/* Scrollable Data Columns */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.scrollableColumns}
            contentContainerStyle={{ minWidth: scrollableColumnsWidth }}
          >
            <View style={[styles.scrollableContent, { width: scrollableColumnsWidth, backgroundColor: colors.surface }]}>
              {/* Scrollable Data Header */}
              <View style={[styles.scrollableHeader, { backgroundColor: colors.tableHeader, borderBottomColor: colors.tableBorder }]}>
                {visibleColumns.filter(col => col.key !== 'symbol').map((column) => {
                  const isActive = sortConfig.key === column.key;
                  const isSelected = selectedColumn === column.key;
                  
                  return (
                    <TouchableOpacity
                      key={column.key}
                      style={[
                        styles.headerCell,
                        column.numeric && styles.numericHeaderCell,
                        isActive && { backgroundColor: colors.primaryLight },
                        isSelected && { backgroundColor: colors.primaryHeader },
                        { 
                          width: column.width,
                          backgroundColor: isSelected ? colors.primaryHeader : colors.tableHeader,
                          borderRightColor: colors.tableBorder
                        }
                      ]}
                      onPress={() => {
                        handleSort(column.key);
                        handleColumnSelect(column.key);
                      }}
                    >
                      <View style={styles.headerContent}>
                        <Text style={[
                          styles.headerText, 
                          { color: isSelected ? '#fff' : colors.text }
                        ]}>
                          {column.label}
                        </Text>
                        <Text style={[
                          styles.sortIndicator, 
                          { color: isSelected ? '#fff' : colors.textSecondary }
                        ]}>
                          {isActive ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* Scrollable Data Rows */}
              <ScrollView 
                ref={dataColumnsScrollRef}
                showsVerticalScrollIndicator={true}
                style={styles.verticalScroll}
                onScroll={handleDataColumnsScroll}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
              >
                {processedData.length === 0 ? (
                  <View style={[styles.emptyState, { height: 200 }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {isLoading ? 'Loading...' : 'No ETFs match your search.'}
                    </Text>
                  </View>
                ) : (
                  processedData.map((item) => (
                    <View key={item.symbol} style={[styles.scrollableRow, { backgroundColor: colors.tableRow, borderBottomColor: colors.tableBorderLight }]}>
                      {visibleColumns.filter(col => col.key !== 'symbol').map((column) => {
                        const value = item[column.key];
                        const renderedValue = column.render ? column.render(value, item) : (value ?? '—');
                        
                        return (
                          <View key={column.key} style={[styles.tableCell, column.numeric && styles.numericCell, { width: column.width, borderRightColor: colors.tableBorderLight }]}>
                            <Text style={[
                              styles.cellText,
                              { color: colors.text },
                              (column.key === 'changePercent' || column.key === 'weeklyReturn' || 
                               column.key === 'monthlyReturn' || column.key === 'yearlyReturn' || 
                               column.key === 'twoYearReturn') && { fontWeight: '700' },
                              column.key === 'changePercent' && value > 0 && { color: colors.positive },
                              column.key === 'changePercent' && value < 0 && { color: colors.negative },
                              column.key === 'weeklyReturn' && value > 0 && { color: colors.positive },
                              column.key === 'weeklyReturn' && value < 0 && { color: colors.negative },
                              column.key === 'monthlyReturn' && value > 0 && { color: colors.positive },
                              column.key === 'monthlyReturn' && value < 0 && { color: colors.negative },
                              column.key === 'yearlyReturn' && value > 0 && { color: colors.positive },
                              column.key === 'yearlyReturn' && value < 0 && { color: colors.negative },
                              column.key === 'twoYearReturn' && value > 0 && { color: colors.positive },
                              column.key === 'twoYearReturn' && value < 0 && { color: colors.negative },
                            ]}>
                              {renderedValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
      
      
      {errorMessage && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {errorMessage}</Text>
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
  tableContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#1f2937',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    height: 38,
  },
  buttonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Table Styles
  tableWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fixedColumn: {
    width: 120,
    borderRightWidth: 1,
    zIndex: 1000,
  },
  fixedHeaderCell: {
    height: 35,
    paddingHorizontal: 8,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fixedColumnScroll: {
    maxHeight: 700,
    // Performance optimizations
    overScrollMode: 'never',
    bounces: false,
  },
  fixedRowCell: {
    height: 30,
    paddingVertical: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollableColumns: {
    flex: 1,
  },
  scrollableContent: {
  },
  verticalScroll: {
    maxHeight: 700, // Increased height to show more rows
    // Performance optimizations
    overScrollMode: 'never',
    bounces: false,
  },
  
  // Table Header
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 30, // Fixed header height
  },
  scrollableHeader: {
    flexDirection: 'row',
    height: 35,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCell: {
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    width: 100, // Fixed width for consistent alignment
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    height: 35, // Match header height,
    borderRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  sortIndicator: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 4,
  },
  numericHeaderCell: {
    alignItems: 'flex-end',
  },
  
  // Table Rows
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 30, // Fixed row height to match header
  },
  scrollableRow: {
    flexDirection: 'row',
    height: 30,
    borderBottomWidth: 1,
  },
  tableCell: {
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    width: 100, // Fixed width to match header cells
    justifyContent: 'center',
    height: 30, // Match row height
  },
  numericCell: {
    alignItems: 'flex-end',
  },
  cellText: {
    fontSize: 12,
    color: '#1f2937',
  },
  symbolButton: {
    padding: 4,
  },
  symbolText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  // Error
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

export default DashboardScreen;
