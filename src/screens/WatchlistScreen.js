import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useAuth } from '../contexts/AuthContext';
import { cacheUtils } from '../utils/cache';
import { SUMMARY_API_URL, PRICES_API_URL, parseNumber, formatters } from '../utils/helpers';
import { getDisplaySymbol } from '../utils/symbolUtils';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import GoogleSignInComponent from '../components/GoogleSignIn';
import AdMobBanner from '../components/AdMobBanner';

const WatchlistScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const { 
    watchlist, 
    loading: watchlistLoading, 
    addToWatchlist, 
    removeFromWatchlist, 
    isInWatchlist,
    getWatchlistCount 
  } = useWatchlist();
  
  const [etfData, setEtfData] = useState([]);
  const [pricesData, setPricesData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'changePercent', dir: 'desc' });
  const [selectedColumn, setSelectedColumn] = useState('currentPrice');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingSymbols, setLoadingSymbols] = useState(new Set());
  
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

  // Column configuration - matching dashboard exactly
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

  // Data processing function - matching dashboard
  const processWatchlistData = (watchlistItems, summaryData, pricesData) => {
    return watchlistItems.map((item) => {
      const etf = summaryData.find(e => e.symbol === item.symbol);
      const details = etf?.details ?? {};
      const symbol = item.symbol ?? '—';
      const priceInfo = pricesData[symbol] || {};
      
      const currentPrice = priceInfo.currentPrice || priceInfo.price || priceInfo.lastPrice || priceInfo.current;
      const changePercent = priceInfo.changePercent || priceInfo.change || priceInfo.percentChange || priceInfo.changePct;

      return {
        symbol,
        currentPrice: parseNumber(currentPrice),
        changePercent: parseNumber(changePercent),
        recordDate: details.recordDate ?? '',
        lastClosePrice: parseNumber(details.lastClosePrice),
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

  // Fetch ETF data with caching
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
        
      // Only set data when we have both summary and prices data
      if (summaryData && pricesData) {
        setEtfData(summaryData);
        setPricesData(pricesData);
      } else if (summaryData) {
        // Fallback: render with summary only if prices fail
        setEtfData(summaryData);
        setPricesData(pricesData ?? {});
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

  const handleAddToWatchlist = async (symbol) => {
    setLoadingSymbols(prev => new Set(prev).add(symbol));
    try {
      const etf = etfData.find(e => e.symbol === symbol);
      const price = pricesData[symbol];
      
      await addToWatchlist(symbol, {
        details: etf?.details,
        currentPrice: price?.currentPrice || etf?.details?.lastClosePrice,
        changePercent: price?.changePercent,
        volume: price?.volume || etf?.details?.lastDayVolume
      });
      
      setShowAddModal(false);
      setSearchQuery('');
      Alert.alert('Success', 'ETF added to watchlist!');
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
  };

  const handleAddButtonPress = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add ETFs to your watchlist.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => {/* User can sign in using the Google Sign-In component below */} }
        ]
      );
      return;
    }
    setShowAddModal(true);
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${getDisplaySymbol(symbol)} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromWatchlist(symbol);
              Alert.alert('Success', 'ETF removed from watchlist!');
            } catch (error) {
              console.error('Error removing from watchlist:', error);
              Alert.alert('Error', 'Failed to remove ETF from watchlist. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Process and filter watchlist data
  const processedWatchlistData = useMemo(() => {
    const processed = processWatchlistData(watchlist, etfData, pricesData);
    
    // Apply search filter
    let filtered = processed;
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
  }, [watchlist, etfData, pricesData, searchQuery, sortConfig]);

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

  // Authentication handlers
  const handleGoogleSignIn = useCallback(async (userInfo) => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }, [signInWithGoogle]);

  // Get visible columns only
  const visibleColumns = useMemo(() => {
    return COLUMNS.filter(col => !col.hidden);
  }, []);

  // Calculate scrollable columns width (excluding symbol column)
  const scrollableColumnsWidth = useMemo(() => {
    const scrollableColumns = visibleColumns.filter(col => col.key !== 'symbol');
    return scrollableColumns.reduce((total, col) => total + col.width, 0);
  }, [visibleColumns]);


  const filteredETFs = useMemo(() => {
    if (!searchQuery.trim()) {
      return etfData
        .filter(etf => !isInWatchlist(etf.symbol));
    }
    
    const query = searchQuery.toLowerCase().trim();
    return etfData
      .filter(etf => {
        const symbol = getDisplaySymbol(etf.symbol).toLowerCase();
        const name = etf.details?.name?.toLowerCase() || '';
        const isNotInWatchlist = !isInWatchlist(etf.symbol);
        const matchesSearch = symbol.includes(query) || name.includes(query);
        return isNotInWatchlist && matchesSearch;
      });
  }, [etfData, searchQuery, isInWatchlist]);



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

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add ETF to Watchlist</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={[styles.modalSearchContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.modalSearchIcon} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.text }]}
                placeholder="Search by symbol or name..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            
            <View style={styles.modalResultsHeader}>
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {filteredETFs.length} ETFs available
              </Text>
              {searchQuery.trim() && (
                <Text style={[styles.searchHint, { color: colors.textSecondary }]}>
                  Showing results for "{searchQuery}"
                </Text>
              )}
            </View>
            
            <FlatList
              data={filteredETFs}
              renderItem={({ item }) => {
                const priceInfo = pricesData[item.symbol] || {};
                const currentPrice = priceInfo.currentPrice || item.details?.lastClosePrice;
                const changePercent = priceInfo.changePercent;
                const etfName = item.details?.name || '';
                const isLoading = loadingSymbols.has(item.symbol);
                
                return (
                  <TouchableOpacity
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleAddToWatchlist(item.symbol)}
                    disabled={isLoading}
                  >
                    <View style={styles.suggestionContent}>
                      <View style={styles.suggestionHeader}>
                        <Text style={[styles.suggestionSymbol, { color: colors.symbol }]}>
                          {getDisplaySymbol(item.symbol)}
                        </Text>
                        <Text style={[styles.suggestionPrice, { color: colors.text }]}>
                          {formatters.price(currentPrice)}
                        </Text>
                      </View>
                      {etfName && (
                        <Text style={[styles.suggestionName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {etfName}
                        </Text>
                      )}
                      {changePercent !== undefined && (
                        <Text style={[
                          styles.suggestionChange, 
                          { 
                            color: changePercent >= 0 ? colors.positive : colors.negative,
                            fontWeight: '600'
                          }
                        ]}>
                          {formatters.percent(changePercent)}
                        </Text>
                      )}
                    </View>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.symbol}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Watchlist" />
        <LoadingSpinner size="large" text="Loading..." />
      </View>
    );
  }

  // Show Google Sign-In if user is not authenticated
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Watchlist" />
        
        <GoogleSignInComponent
          onSignIn={handleGoogleSignIn}
          user={user}
          loading={authLoading}
        />
        
        {/* Bottom Banner Ad */}
        <View style={[styles.footerAdContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <AdMobBanner />
        </View>
      </View>
    );
  }

  if (isLoading || watchlistLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Watchlist" />
        <LoadingSpinner size="large" text="Loading watchlist..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Watchlist" />
      
      <View style={styles.content}>
        {/* Watchlist Actions */}
        <View style={[styles.actionsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddButtonPress}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
            <Text style={[styles.addButtonText, { color: colors.surface }]}>Add ETF</Text>
          </TouchableOpacity>
          <Text style={[styles.watchlistStats, { color: colors.text }]}>
            {getWatchlistCount()} ETFs in watchlist
          </Text>
        </View>

        {/* Watchlist Table */}
        {watchlist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your watchlist is empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Start adding ETFs to track their performance</Text>
            <TouchableOpacity 
              style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
              onPress={handleAddButtonPress}
            >
              <Text style={[styles.addFirstButtonText, { color: colors.surface }]}>Add your first ETF</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                  {processedWatchlistData.length === 0 ? (
                    <View style={[styles.emptyState, { height: 200 }]}>
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {isLoading ? 'Loading...' : 'No ETFs match your search.'}
                      </Text>
                    </View>
                  ) : (
                    processedWatchlistData.map((item) => (
                      <View key={item.symbol} style={[styles.fixedRowCell, { backgroundColor: colors.tableRow, borderBottomColor: colors.tableBorderLight }]}>
                        <TouchableOpacity
                          style={styles.symbolButton}
                          onPress={() => handleRowPress(item.symbol)}
                        >
                          <Text style={[styles.symbolText, { color: colors.symbol }]}>{getDisplaySymbol(item.symbol)}</Text>
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
                    {processedWatchlistData.length === 0 ? (
                      <View style={[styles.emptyState, { height: 200 }]}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          {isLoading ? 'Loading...' : 'No ETFs match your search.'}
                        </Text>
                      </View>
                    ) : (
                      processedWatchlistData.map((item) => (
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
        )}

        {renderAddModal()}
        
        {/* Banner Ad above bottom tabs */}
        <View style={[styles.footerAdContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <AdMobBanner />
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
  content: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5b9bfd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  watchlistStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#5b9bfd',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Table Styles - matching dashboard exactly
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
    // alignItems: 'flex-end',
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
    padding: 40,
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 48,
  },
  modalSearchIcon: {
    marginRight: 12,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  modalResultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchHint: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'transparent',
  },
  suggestionContent: {
    flex: 1,
    marginRight: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  suggestionName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  suggestionChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Banner Footer (above bottom tabs)
  footerAdContainer: {
    borderTopWidth: 1,
  },
  // Top Banner Ad
  topBannerAdContainer: {
    borderBottomWidth: 1,
  },
});

export default WatchlistScreen;