import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Text from '../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import { PRICES_API_URL, SUMMARY_API_URL, GLOBAL_MARKETS_API_URL, parseNumber } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AdMobBanner from '../components/AdMobBanner';

const MarketOverviewScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [sectorData, setSectorData] = useState([]);
  const [allGlobalMarkets, setAllGlobalMarkets] = useState([]); // Store all global markets for filtering
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1D');
  const [selectedTab, setSelectedTab] = useState('indian'); // 'indian' or 'global'
  const [selectedRegion, setSelectedRegion] = useState('all'); // 'all', 'asia-pac', 'europe', 'north-am', 'south-am'

  // Define major sectors and their representative ETFs
  const SECTORS = [
    // Precious Metals
    { name: 'Gold', etfs: ['SETFGOLD.NS'], icon: '🥇', color: '#fbbf24' },
    { name: 'Silver', etfs: ['SILVER1.NS'], icon: '🥈', color: '#9ca3af' },
    
    // Banking & Finance
    { name: 'Banking', etfs: ['BANKBEES.NS'], icon: '🏦', color: '#2563eb' },
    { name: 'Private Banks', etfs: ['PVTBANIETF.NS'], icon: '🏛️', color: '#4f46e5' },
    { name: 'PSU Banks', etfs: ['PSUBNKBEES.NS'], icon: '🏢', color: '#0891b2' },
    { name: 'Financial Services', etfs: ['BFSI.NS'], icon: '💰', color: '#f59e0b' },
    { name: 'Capital Markets', etfs: ['MOCAPITAL.NS'], icon: '📈', color: '#8b5cf6' },
    
    // Technology
    { name: 'IT', etfs: ['ITBEES.NS'], icon: '💻', color: '#7c3aed' },
    { name: 'Internet', etfs: ['INTERNET.NS'], icon: '🌐', color: '#06b6d4' },
    
    // International Indices
    { name: 'Nasdaq 100', etfs: ['MON100.NS'], icon: '🇺🇸', color: '#dc2626' },
    { name: 'NYSE FANG+', etfs: ['MAFANG.NS'], icon: '📱', color: '#ea580c' },
    { name: 'Hang Seng Tech', etfs: ['HNGSNGBEES.NS'], icon: '🇨🇳', color: '#ef4444' },
    
    // Broad Market
    { name: 'Nifty 50', etfs: ['NIFTYBEES.NS'], icon: '📊', color: '#059669' },
    { name: 'Nifty Next 50', etfs: ['NEXT50IETF.NS'], icon: '📉', color: '#10b981' },
    
    // Sectors
    { name: 'Auto', etfs: ['AUTOBEES.NS'], icon: '🚗', color: '#dc2626' },
    { name: 'EV & New Auto', etfs: ['EVINDIA.NS'], icon: '🔋', color: '#22c55e' },
    { name: 'Power', etfs: ['GROWWPOWER.NS'], icon: '⚡', color: '#eab308' },
    { name: 'Oil & Gas', etfs: ['OILIETF.NS'], icon: '🛢️', color: '#f97316' },
    { name: 'Metals', etfs: ['METALIETF.NS'], icon: '🔧', color: '#6b7280' },
    { name: 'Realty', etfs: ['MOREALTY.NS'], icon: '🏗️', color: '#84cc16' },
    { name: 'Railways', etfs: ['GROWWRAIL.NS'], icon: '🚂', color: '#0ea5e9' },
    { name: 'Defence', etfs: ['MODEFENCE.NS'], icon: '🛡️', color: '#991b1b' },
    { name: 'PSE', etfs: ['CPSEETF.NS'], icon: '🏛️', color: '#0891b2' },
    { name: 'Pharma', etfs: ['PHARMABEES.NS'], icon: '💊', color: '#059669' },
    { name: 'FMCG', etfs: ['FMCGIETF.NS'], icon: '🛒', color: '#ea580c' },
    { name: 'Consumption', etfs: ['CONSUMBEES.NS'], icon: '🛍️', color: '#ec4899' },
    { name: 'Manufacturing', etfs: ['MOMGF.NS'], icon: '🏭', color: '#737373' },
    { name: 'Healthcare', etfs: ['HEALTHY.NS'], icon: '🏥', color: '#ec4899' }
  ];

  // Time period configurations
  const PERIODS = [
    { key: '1D', label: '1 Day', field: 'changePercent' },
    { key: '1W', label: '1 Week', field: 'weeklyReturn' },
    { key: '1M', label: '1 Month', field: 'monthlyReturn' },
    { key: '1Y', label: '1 Year', field: 'yearlyReturn' }
  ];

  // Region filter configurations for global markets
  const REGIONS = [
    { key: 'all', label: 'All' },
    { key: 'asia-pac', label: 'Asia-Pac' },
    { key: 'europe', label: 'Europe' },
    { key: 'north-am', label: 'North Am' },
    { key: 'south-am', label: 'South Am' }
  ];

  useEffect(() => {
    if (selectedTab === 'indian') {
      fetchSectorData();
    } else {
      // Reset region to 'all' when switching to global tab
      setSelectedRegion('all');
      fetchGlobalMarketData();
    }
  }, [selectedTab]);

  // Filter global markets by region
  useEffect(() => {
    if (selectedTab === 'global' && allGlobalMarkets.length > 0) {
      if (selectedRegion === 'all') {
        setSectorData(allGlobalMarkets);
      } else {
        const filtered = allGlobalMarkets.filter(market => {
          return market.region === selectedRegion;
        });
        setSectorData(filtered);
      }
    }
  }, [selectedRegion, allGlobalMarkets, selectedTab]);

  // Helper function to determine market region
  const getMarketRegion = (marketName) => {
    const nameLower = marketName.toLowerCase();
    
    // Asia-Pacific
    if (nameLower.includes('nikkei') || nameLower.includes('japan') ||
        nameLower.includes('hang seng') || nameLower.includes('hong kong') ||
        nameLower.includes('shanghai') || nameLower.includes('shenzhen') || nameLower.includes('china') ||
        nameLower.includes('asx') || nameLower.includes('australia') ||
        nameLower.includes('kospi') || nameLower.includes('south korea') ||
        nameLower.includes('taiwan') || nameLower.includes('singapore') ||
        nameLower.includes('india') || nameLower.includes('nifty') || nameLower.includes('sensex') ||
        nameLower.includes('indonesia') || nameLower.includes('thailand') ||
        nameLower.includes('philippines') || nameLower.includes('malaysia')) {
      return 'asia-pac';
    }
    
    // Europe
    if (nameLower.includes('ftse') || nameLower.includes('uk') || nameLower.includes('britain') ||
        nameLower.includes('dax') || nameLower.includes('germany') ||
        nameLower.includes('cac') || nameLower.includes('france') ||
        nameLower.includes('ibex') || nameLower.includes('spain') ||
        nameLower.includes('ftse mib') || nameLower.includes('italy') ||
        nameLower.includes('aex') || nameLower.includes('netherlands') ||
        nameLower.includes('swiss') || nameLower.includes('sweden') ||
        nameLower.includes('norway') || nameLower.includes('denmark') ||
        nameLower.includes('euro') || nameLower.includes('stoxx')) {
      return 'europe';
    }
    
    // North America
    if (nameLower.includes('s&p') || nameLower.includes('sp500') ||
        nameLower.includes('nasdaq') || nameLower.includes('dow') ||
        nameLower.includes('usa') || nameLower.includes('united states') ||
        nameLower.includes('tsx') || nameLower.includes('canada') ||
        nameLower.includes('mexico')) {
      return 'north-am';
    }
    
    // South America
    if (nameLower.includes('brazil') || nameLower.includes('bovespa') ||
        nameLower.includes('argentina') || nameLower.includes('chile') ||
        nameLower.includes('colombia') || nameLower.includes('peru')) {
      return 'south-am';
    }
    
    // Default to all if can't determine
    return 'all';
  };

  const fetchSectorData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both summary and price data
      const [summaryResponse, pricesResponse] = await Promise.all([
        fetch(SUMMARY_API_URL),
        fetch(PRICES_API_URL)
      ]);

      if (!summaryResponse.ok || !pricesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const summaryData = await summaryResponse.json();
      const pricesArray = await pricesResponse.json();
      
      // Convert prices array to object for easier lookup
      const pricesData = pricesArray.reduce((acc, item) => {
        if (item.key) {
          acc[item.key] = {
            currentPrice: item.currentPrice,
            changePercent: item.changePercent,
            change: item.change
          };
        }
        return acc;
      }, {});

      // Process sector data
      const processedSectors = SECTORS.map(sector => {
        const sectorETFs = sector.etfs.map(etfSymbol => {
          const summaryItem = summaryData.find(item => item.symbol === etfSymbol);
          const priceItem = pricesData[etfSymbol] || {};
          
          if (summaryItem && summaryItem.details) {
            return {
              symbol: etfSymbol,
              currentPrice: parseNumber(priceItem.currentPrice),
              changePercent: parseNumber(priceItem.changePercent),
              weeklyReturn: parseNumber(summaryItem.details['1weekReturns']),
              monthlyReturn: parseNumber(summaryItem.details['1monthReturns']),
              yearlyReturn: parseNumber(summaryItem.details['1yearReturns']),
              volume: parseNumber(summaryItem.details.lastDayVolume),
              rsi: parseNumber(summaryItem.details.dailyRSI)
            };
          }
          return null;
        }).filter(Boolean);

        // Calculate average performance for the sector
        const avgPerformance = {
          changePercent: calculateAverage(sectorETFs, 'changePercent'),
          weeklyReturn: calculateAverage(sectorETFs, 'weeklyReturn'),
          monthlyReturn: calculateAverage(sectorETFs, 'monthlyReturn'),
          yearlyReturn: calculateAverage(sectorETFs, 'yearlyReturn'),
          avgVolume: calculateAverage(sectorETFs, 'volume'),
          avgRSI: calculateAverage(sectorETFs, 'rsi')
        };

        return {
          ...sector,
          etfData: sectorETFs,
          performance: avgPerformance
        };
      });

      setSectorData(processedSectors);
    } catch (error) {
      console.error('Error fetching sector data:', error);
      // Use mock data for demonstration
      setSectorData(getMockSectorData());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalMarketData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(GLOBAL_MARKETS_API_URL, {
        headers: {
          'accept': '*/*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch global market data');
      }

      const globalData = await response.json();
      
      // Process global market data - adapt based on API response structure
      // Assuming the API returns an array of market indices/ETFs
      let processedMarkets = [];
      
      if (Array.isArray(globalData)) {
        // If it's an array, process each item
        processedMarkets = globalData.map((item, index) => {
          // Extract relevant fields - adjust based on actual API response
          const name = item.name || item.symbol || item.index || `Market ${index + 1}`;
          const changePercent = parseNumber(item.changePercent || item.change || item.change_pct || item.percentChange);
          const weeklyReturn = parseNumber(item.weeklyReturn || item.weekChange || item.week_change);
          const monthlyReturn = parseNumber(item.monthlyReturn || item.monthChange || item.month_change);
          const yearlyReturn = parseNumber(item.yearlyReturn || item.yearChange || item.year_change);
          
          // Get icon based on name or symbol
          const icon = getGlobalMarketIcon(name);
          const region = getMarketRegion(name);
          
          return {
            name: name,
            icon: icon,
            region: region,
            color: '#6366f1',
            etfData: [],
            performance: {
              changePercent: changePercent,
              weeklyReturn: weeklyReturn,
              monthlyReturn: monthlyReturn,
              yearlyReturn: yearlyReturn,
              avgVolume: null,
              avgRSI: null
            }
          };
        });
      } else if (globalData && typeof globalData === 'object') {
        // If it's an object, try to extract markets from common keys
        const marketsArray = globalData.markets || globalData.data || globalData.indices || [globalData];
        processedMarkets = marketsArray.map((item, index) => {
          const name = item.name || item.symbol || item.index || item.country || `Market ${index + 1}`;
          const changePercent = parseNumber(item.changePercent || item.change || item.change_pct || item.percentChange);
          const weeklyReturn = parseNumber(item.weeklyReturn || item.weekChange || item.week_change);
          const monthlyReturn = parseNumber(item.monthlyReturn || item.monthChange || item.month_change);
          const yearlyReturn = parseNumber(item.yearlyReturn || item.yearChange || item.year_change);
          
          const icon = getGlobalMarketIcon(name);
          const region = getMarketRegion(name);
          
          return {
            name: name,
            icon: icon,
            region: region,
            color: '#6366f1',
            etfData: [],
            performance: {
              changePercent: changePercent,
              weeklyReturn: weeklyReturn,
              monthlyReturn: monthlyReturn,
              yearlyReturn: yearlyReturn,
              avgVolume: null,
              avgRSI: null
            }
          };
        });
      }

      // Store all markets and apply region filter
      setAllGlobalMarkets(processedMarkets.length > 0 ? processedMarkets : []);
      if (selectedRegion === 'all') {
        setSectorData(processedMarkets.length > 0 ? processedMarkets : []);
      } else {
        const filtered = processedMarkets.filter(market => {
          return market.region === selectedRegion;
        });
        setSectorData(filtered);
      }
    } catch (error) {
      console.error('Error fetching global market data:', error);
      setSectorData([]);
      setAllGlobalMarkets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getGlobalMarketIcon = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('s&p') || nameLower.includes('sp500')) return '🇺🇸';
    if (nameLower.includes('nasdaq')) return '📱';
    if (nameLower.includes('dow')) return '📈';
    if (nameLower.includes('ftse')) return '🇬🇧';
    if (nameLower.includes('dax')) return '🇩🇪';
    if (nameLower.includes('cac')) return '🇫🇷';
    if (nameLower.includes('nikkei')) return '🇯🇵';
    if (nameLower.includes('hang seng') || nameLower.includes('hong kong')) return '🇭🇰';
    if (nameLower.includes('shanghai') || nameLower.includes('shenzhen')) return '🇨🇳';
    if (nameLower.includes('asx') || nameLower.includes('australia')) return '🇦🇺';
    if (nameLower.includes('tsx') || nameLower.includes('canada')) return '🇨🇦';
    if (nameLower.includes('brazil') || nameLower.includes('bovespa')) return '🇧🇷';
    if (nameLower.includes('india') || nameLower.includes('nifty') || nameLower.includes('sensex')) return '🇮🇳';
    return '🌍';
  };

  const calculateAverage = (data, field) => {
    const validValues = data.map(item => item[field]).filter(val => val != null);
    if (validValues.length === 0) return null;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  };

  const getMockSectorData = () => {
    return SECTORS.map(sector => ({
      ...sector,
      performance: {
        changePercent: (Math.random() - 0.5) * 5,
        weeklyReturn: (Math.random() - 0.5) * 10,
        monthlyReturn: (Math.random() - 0.5) * 15,
        yearlyReturn: (Math.random() - 0.5) * 50,
        avgVolume: Math.random() * 10000000,
        avgRSI: 30 + Math.random() * 40
      }
    }));
  };

  const getPerformanceValue = (sector, period) => {
    // For global markets, always use changePercent (1D)
    if (selectedTab === 'global') {
      return sector.performance?.changePercent;
    }
    // For Indian markets, use the selected period
    const field = PERIODS.find(p => p.key === period)?.field;
    return sector.performance?.[field];
  };

  const formatPerformance = (value) => {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const handleSectorPress = (sector) => {
    // Navigate to the first ETF in the sector (only for Indian market)
    if (selectedTab === 'indian' && sector.etfData && sector.etfData.length > 0) {
      navigation.navigate('ETFDetail', { symbol: sector.etfData[0].symbol });
    }
    // For global markets, we might not have ETF symbols, so do nothing or show info
  };

  // Sort sectors by current selection for better at-a-glance overview
  const sortedSectors = [...sectorData]
    .filter(sector => getPerformanceValue(sector, selectedPeriod) != null)
    .sort((a, b) => {
      const av = getPerformanceValue(a, selectedPeriod);
      const bv = getPerformanceValue(b, selectedPeriod);
      return (bv ?? -9999) - (av ?? -9999);
    });

  const handleRefresh = () => {
    if (selectedTab === 'global') {
      fetchGlobalMarketData();
    } else {
      fetchSectorData();
    }
  };

  const renderTabSelector = () => (
    <View style={[styles.tabSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: colors.surfaceSecondary },
          selectedTab === 'indian' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setSelectedTab('indian')}
      >
        <Text style={[
          styles.tabText,
          { color: colors.text },
          selectedTab === 'indian' && { color: colors.surface, fontWeight: '600' }
        ]}>
          🇮🇳 Indian Market
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: colors.surfaceSecondary },
          selectedTab === 'global' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setSelectedTab('global')}
      >
        <Text style={[
          styles.tabText,
          { color: colors.text },
          selectedTab === 'global' && { color: colors.surface, fontWeight: '600' }
        ]}>
          🌍 Global Market
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegionFilter = () => (
    <View style={[styles.regionFilter, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionFilterContent}
      >
        {REGIONS.map(region => (
          <TouchableOpacity
            key={region.key}
            style={[
              styles.regionChip, 
              { backgroundColor: colors.surfaceSecondary },
              selectedRegion === region.key && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedRegion(region.key)}
          >
            <Text style={[
              styles.regionChipText, 
              { color: colors.text },
              selectedRegion === region.key && { color: colors.surface, fontWeight: '600' }
            ]}>
              {region.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {PERIODS.map(period => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodChip, 
            { backgroundColor: colors.surfaceSecondary },
            selectedPeriod === period.key && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSelectedPeriod(period.key)}
        >
          <Text style={[
            styles.periodChipText, 
            { color: colors.text },
            selectedPeriod === period.key && { color: colors.surface }
          ]}>
            {period.key}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSectorTile = ({ item: sector }) => {
    const value = getPerformanceValue(sector, selectedPeriod);
    if (value == null) return null;
    
    const isPositive = value >= 0;
    const displayValue = value.toFixed(1);

    return (
      <TouchableOpacity
        style={[
          styles.sectorTile,
          { backgroundColor: colors.surface },
          isPositive && { borderColor: colors.positive },
          !isPositive && { borderColor: colors.negative }
        ]}
        onPress={() => handleSectorPress(sector)}
        disabled={selectedTab === 'global' && (!sector.etfData || sector.etfData.length === 0)}
      >
        <Text style={styles.tileIcon}>{sector.icon}</Text>
        <Text style={[styles.tileName, { color: colors.text }]} numberOfLines={2}>
          {sector.name}
        </Text>
        <Text style={[
          styles.tileValue, 
          { color: isPositive ? colors.positive : colors.negative }
        ]}>
          {displayValue}%
        </Text>
      </TouchableOpacity>
    );
  };

  const renderQuickStats = () => {
    const gainers = sortedSectors.filter(s => getPerformanceValue(s, selectedPeriod) > 0).length;
    const losers = sortedSectors.filter(s => getPerformanceValue(s, selectedPeriod) < 0).length;
    const topSector = sortedSectors[0];

    return (
      <View style={[styles.quickStats, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gainers</Text>
          <Text style={[styles.statValue, { color: colors.positive }]}>{gainers}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Losers</Text>
          <Text style={[styles.statValue, { color: colors.negative }]}>{losers}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Top</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {topSector?.name ? `${topSector.icon} ${formatPerformance(getPerformanceValue(topSector, selectedPeriod))}` : '—'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Market Overview" />
        <LoadingSpinner size="large" text="Loading market data..." />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={{ marginBottom: 10 }}>
      {renderTabSelector()}
      {selectedTab === 'global' ? renderRegionFilter() : renderPeriodSelector()}
    </View>
  );

  const renderFooter = () => (
    <>
      {renderQuickStats()}
      <View style={[styles.footerAdContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <AdMobBanner />
      </View>
      <View style={{ height: 8 }} />
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Market Overview" />
      
      <FlatList
        data={sortedSectors}
        renderItem={renderSectorTile}
        keyExtractor={(item) => item.name}
        numColumns={4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tilesContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        style={styles.content}
      />
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
  tabSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  regionFilter: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  regionFilterContent: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingRight: 4,
  },
  regionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    minWidth: 50,
    alignItems: 'center',
  },
  regionChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
  },
  refreshIcon: {
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  activePeriodChip: {
    backgroundColor: '#2563eb',
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activePeriodChipText: {
    color: '#fff',
  },
  sectorTilesGrid: {
    paddingHorizontal: 16,
  },
  tilesContainer: {
    paddingBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  sectorTile: {
    flex: 1,
    margin: 2,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  gainTile: {
    // Additional styles for gain tiles
  },
  lossTile: {
    // Additional styles for loss tiles
  },
  tileIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tileName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gainValue: {
    color: '#059669',
  },
  lossValue: {
    color: '#dc2626',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  // Banner Footer (non-interactive container to avoid accidental clicks)
  footerAdContainer: {
    // paddingVertical: 12,
    // paddingHorizontal: 8,
    borderTopWidth: 1,
  },
});

export default MarketOverviewScreen;
