import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PRICES_API_URL, SUMMARY_API_URL, parseNumber } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const MarketOverviewScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [sectorData, setSectorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1D');

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

  useEffect(() => {
    fetchSectorData();
  }, []);

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
    const field = PERIODS.find(p => p.key === period)?.field;
    return sector.performance?.[field];
  };

  const formatPerformance = (value) => {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const handleSectorPress = (sector) => {
    // Navigate to the first ETF in the sector
    if (sector.etfData && sector.etfData.length > 0) {
      navigation.navigate('ETFDetail', { symbol: sector.etfData[0].symbol });
    }
  };

  // Sort sectors by current selection for better at-a-glance overview
  const sortedSectors = [...sectorData].sort((a, b) => {
    const av = getPerformanceValue(a, selectedPeriod);
    const bv = getPerformanceValue(b, selectedPeriod);
    return (bv ?? -9999) - (av ?? -9999);
  });

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
    const value = getPerformanceValue(sector, selectedPeriod) ?? 0;
    const isPositive = value >= 0;
    const intensity = Math.min(100, Math.abs(value) * 20);

    return (
      <TouchableOpacity
        style={[
          styles.sectorTile,
          { backgroundColor: colors.surface },
          isPositive && { borderColor: colors.positive },
          !isPositive && { borderColor: colors.negative }
        ]}
        onPress={() => handleSectorPress(sector)}
      >
        <Text style={styles.tileIcon}>{sector.icon}</Text>
        <Text style={[styles.tileName, { color: colors.text }]}>{sector.name}</Text>
        <Text style={[
          styles.tileValue, 
          { color: isPositive ? colors.positive : colors.negative }
        ]}>
          {value.toFixed(1)}%
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
    <>
      {renderPeriodSelector()}
    </>
  );

  const renderFooter = () => (
    <>
      {renderQuickStats()}
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activePeriodChip: {
    backgroundColor: '#2563eb',
  },
  periodChipText: {
    fontSize: 14,
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
});

export default MarketOverviewScreen;
