import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { formatters, formatCurrency, formatLargeNumber } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';

const MetricsCards = ({ metrics, etfInfo, priceRange }) => {
  const { colors } = useTheme();
  
  const formatValue = (value, isPercentage = true) => {
    if (value === null || value === undefined || value === '') return '—';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '—';
    
    if (isPercentage) {
      const formatted = numValue > 0 ? `+${numValue.toFixed(2)}%` : `${numValue.toFixed(2)}%`;
      return formatted;
    }
    
    return numValue.toLocaleString();
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '—';
    return `₹${numValue.toFixed(2)}`;
  };

  const formatVolume = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '—';
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toLocaleString();
  };

  const formatRSI = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '—';
    return numValue.toFixed(2);
  };

  const getRSIStatus = (rsi) => {
    const numValue = parseFloat(rsi);
    if (isNaN(numValue)) return '—';
    if (numValue >= 70) return 'Overbought';
    if (numValue <= 30) return 'Oversold';
    return 'Neutral';
  };

  const getValueColor = (value, isNegative = false) => {
    if (isNegative) return colors.negative;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return colors.text;
    return numValue >= 0 ? colors.positive : colors.negative;
  };

  const getRSIColor = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return colors.text;
    if (numValue >= 70) return colors.negative;
    if (numValue <= 30) return colors.positive;
    return colors.positive; // Neutral RSI in green as shown in image
  };

  // Range Slider Component
  const RangeSlider = ({ min, max, current, title }) => {
    // Check if we have valid data from API
    if (!min || !max || !current || isNaN(min) || isNaN(max) || isNaN(current)) {
      return (
        <View style={styles.rangeContainer}>
          <View style={styles.rangeDataList}>
            <View style={styles.rangeDataRow}>
              <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Min:</Text>
              <Text style={[styles.rangeDataValue, { color: colors.text }]}>—</Text>
            </View>
            <View style={styles.rangeDataRow}>
              <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Current:</Text>
              <Text style={[styles.rangeDataValue, { color: colors.text }]}>—</Text>
            </View>
            <View style={styles.rangeDataRow}>
              <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Max:</Text>
              <Text style={[styles.rangeDataValue, { color: colors.text }]}>—</Text>
            </View>
            <View style={styles.rangeDataRow}>
              <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Position:</Text>
              <Text style={[styles.rangeDataValue, { color: colors.text }]}>—</Text>
            </View>
          </View>
          <View style={styles.rangeSliderContainer}>
            <View style={[styles.rangeSlider, { backgroundColor: colors.border }]}>
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No data available</Text>
            </View>
          </View>
        </View>
      );
    }

    // Calculate position percentage correctly
    // Position = ((current - min) / (max - min)) * 100
    const range = max - min;
    const position = range > 0 ? ((current - min) / range) * 100 : 0;
    
    return (
      <View style={styles.rangeContainer}>
        {/* Data Points List */}
        <View style={styles.rangeDataList}>
          <View style={styles.rangeDataRow}>
            <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Min:</Text>
            <Text style={[styles.rangeDataValue, { color: colors.text }]}>{min.toFixed(2)}</Text>
          </View>
          <View style={styles.rangeDataRow}>
            <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Current:</Text>
            <Text style={[styles.rangeDataValue, { color: colors.positive }]}>{current.toFixed(2)}</Text>
          </View>
          <View style={styles.rangeDataRow}>
            <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Max:</Text>
            <Text style={[styles.rangeDataValue, { color: colors.text }]}>{max.toFixed(2)}</Text>
          </View>
          <View style={styles.rangeDataRow}>
            <Text style={[styles.rangeDataLabel, { color: colors.textSecondary }]}>Position:</Text>
            <Text style={[styles.rangeDataValue, { color: colors.positive }]}>{position.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Range Slider */}
        <View style={styles.rangeSliderContainer}>
          <View style={[styles.rangeSlider, { backgroundColor: colors.border }]}>
            <View style={[
              styles.rangeSliderFill, 
              { 
                width: `${position}%`,
                backgroundColor: colors.positive
              }
            ]} />
            <View style={[
              styles.rangeSliderHandle,
              { 
                left: `${position}%`,
                backgroundColor: colors.surface,
                borderColor: colors.positive,
                transform: [{ translateX: -8 }] // Center the handle properly
              }
            ]}>
              <Text style={[styles.rangeSliderValue, { color: '#ffffff' }]}>{current.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const cardsData = [
    {
      title: 'ETF INFORMATION',
      items: [
        { label: 'Symbol', value: etfInfo?.symbol || '—' },
        { label: 'Category', value: etfInfo?.category || '—' },
        { label: 'P/E Ratio', value: metrics?.peRatio || '—' },
        { label: 'Record Date', value: etfInfo?.recordDate || '—' }
      ]
    },
    {
      title: 'PRICE PERFORMANCE',
      items: [
        { label: '1 Week', value: formatValue(metrics?.weekReturn), isPercentage: true },
        { label: '1 Month', value: formatValue(metrics?.monthReturn), isPercentage: true },
        { label: '1 Year', value: formatValue(metrics?.yearReturn), isPercentage: true },
        { label: '2 Years', value: formatValue(metrics?.twoYearReturn), isPercentage: true }
      ]
    },
    {
      title: 'RSI INDICATORS',
      items: [
        { label: 'Daily RSI', value: formatRSI(metrics?.dailyRSI), isRSI: true },
        { label: 'Weekly RSI', value: formatRSI(metrics?.weeklyRSI), isRSI: true },
        { label: 'Monthly RSI', value: formatRSI(metrics?.monthlyRSI), isRSI: true },
        { label: 'Status', value: getRSIStatus(metrics?.dailyRSI), isText: true, isStatus: true }
      ]
    },
    {
      title: 'PRICE & VOLUME',
      items: [
        { label: 'Current Price', value: formatPrice(metrics?.currentPrice), isPrice: true },
        { label: 'Today\'s Change', value: formatValue(metrics?.todayChange), isPercentage: true },
        { label: 'Volume', value: formatVolume(metrics?.volume), isVolume: true },
        { label: 'Down from 2Y High', value: formatValue(metrics?.downFromHigh, true), isNegative: true }
      ]
    },
    {
      title: 'WEEKLY RANGE',
      isRange: true,
      min: parseFloat(priceRange?.weeklyRange?.min),
      max: parseFloat(priceRange?.weeklyRange?.max),
      current: parseFloat(priceRange?.weeklyRange?.current)
    },
    {
      title: 'MONTHLY RANGE',
      isRange: true,
      min: parseFloat(priceRange?.monthlyRange?.min),
      max: parseFloat(priceRange?.monthlyRange?.max),
      current: parseFloat(priceRange?.monthlyRange?.current)
    },
    {
      title: 'YEARLY RANGE',
      isRange: true,
      min: parseFloat(priceRange?.yearlyRange?.min),
      max: parseFloat(priceRange?.yearlyRange?.max),
      current: parseFloat(priceRange?.yearlyRange?.current)
    },
    {
      title: '2-YEAR RANGE',
      isRange: true,
      min: parseFloat(priceRange?.["2yearlyRange"]?.min),
      max: parseFloat(priceRange?.["2yearlyRange"]?.max),
      current: parseFloat(priceRange?.["2yearlyRange"]?.current)
    }
  ];


  return (
    <View style={styles.container}>
      {/* All Cards - Full Width Vertical Layout */}
      <View style={styles.cardsGrid}>
        {cardsData.map((card, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
            <View style={[styles.cardSeparator, { backgroundColor: colors.border }]} />
            
            {card.isRange ? (
              <RangeSlider 
                min={card.min}
                max={card.max}
                current={card.current}
                title={card.title}
              />
            ) : (
              <View style={styles.cardContent}>
                {card.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.row}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}:</Text>
                    <Text style={[
                      styles.value,
                      { color: item.isRSI ? getRSIColor(item.value) : 
                               item.isPercentage ? getValueColor(item.value) :
                               item.isNegative ? getValueColor(item.value, true) :
                               item.isStatus ? colors.text :
                               colors.text },
                      item.isStatus && { fontWeight: '700' }
                    ]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardSeparator: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  cardContent: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  // Range Slider Styles
  rangeContainer: {
    gap: 12,
  },
  rangeDataList: {
    gap: 8,
  },
  rangeDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeDataLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  rangeDataValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rangeSliderContainer: {
    position: 'relative',
    marginTop: 16,
  },
  rangeSlider: {
    height: 10,
    borderRadius: 5,
    position: 'relative',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rangeSliderFill: {
    height: '100%',
    borderRadius: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeSliderHandle: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  rangeSliderValue: {
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    top: -18,
    left: -10,
    width: 36,
    textAlign: 'center',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeCurrent: {
    fontSize: 12,
    fontWeight: '600',
  },
  rangePosition: {
    fontSize: 12,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default MetricsCards;
