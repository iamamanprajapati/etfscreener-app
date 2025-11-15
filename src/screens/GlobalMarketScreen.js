import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Text from '../components/CustomText';
import { GLOBAL_MARKETS_API_URL, parseNumber } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AdMobBanner from '../components/AdMobBanner';

const GlobalMarketScreen = () => {
  const { colors } = useTheme();
  const [sectorData, setSectorData] = useState([]);
  const [allGlobalMarkets, setAllGlobalMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Region filter configurations
  const REGIONS = [
    { key: 'all', label: 'All' },
    { key: 'asia-pac', label: 'Asia-Pac' },
    { key: 'europe', label: 'Europe' },
    { key: 'north-am', label: 'North Am' },
    { key: 'south-am', label: 'South Am' }
  ];

  useEffect(() => {
    fetchGlobalMarketData();
  }, []);

  // Filter global markets by region
  useEffect(() => {
    if (allGlobalMarkets.length > 0) {
      if (selectedRegion === 'all') {
        setSectorData(allGlobalMarkets);
      } else {
        const filtered = allGlobalMarkets.filter(market => {
          return market.region === selectedRegion;
        });
        setSectorData(filtered);
      }
    }
  }, [selectedRegion, allGlobalMarkets]);

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
      
      // Process global market data
      let processedMarkets = [];
      
      if (Array.isArray(globalData)) {
        processedMarkets = globalData.map((item, index) => {
          const name = item.name || item.symbol || item.index || `Market ${index + 1}`;
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
      } else if (globalData && typeof globalData === 'object') {
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

  const getPerformanceValue = (sector) => {
    return sector.performance?.changePercent;
  };

  const formatPerformance = (value) => {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Sort sectors by performance
  const sortedSectors = [...sectorData]
    .filter(sector => getPerformanceValue(sector) != null)
    .sort((a, b) => {
      const av = getPerformanceValue(a);
      const bv = getPerformanceValue(b);
      return (bv ?? -9999) - (av ?? -9999);
    });

  const handleRefresh = () => {
    fetchGlobalMarketData();
  };

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

  const renderSectorTile = ({ item: sector }) => {
    const value = getPerformanceValue(sector);
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
        disabled={true}
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
    const gainers = sortedSectors.filter(s => getPerformanceValue(s) > 0).length;
    const losers = sortedSectors.filter(s => getPerformanceValue(s) < 0).length;
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
            {topSector?.name ? `${topSector.icon} ${formatPerformance(getPerformanceValue(topSector))}` : '—'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Global Market" />
        <LoadingSpinner size="large" text="Loading market data..." />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={{ marginBottom: 10 }}>
      {renderRegionFilter()}
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
      <Header title="Global Market" />
      
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
  footerAdContainer: {
    borderTopWidth: 1,
  },
});

export default GlobalMarketScreen;

