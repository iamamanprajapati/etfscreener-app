import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ 
  title = "ETF Dashboard", 
  showBackButton = false,
  onBackPress,
  showPrice = false,
  currentPrice,
  changePercent,
  showThemeToggle = true,
  rightButton = null
}) => {
  const { isDarkMode, toggleTheme, colors, isTransitioning } = useTheme();
  const formatPrice = (price) => {
    if (price == null) return '—';
    return `₹${Number(price).toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (change == null) return '—';
    const sign = change > 0 ? '+' : '';
    return `${sign}${Number(change).toFixed(2)}%`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {showPrice && (
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.text }]}>{formatPrice(currentPrice)}</Text>
              <Text style={[
                styles.change,
                changePercent > 0 ? { color: colors.positive } : { color: colors.negative }
              ]}>
                {formatChange(changePercent)}
              </Text>
            </View>
          )}
        </View>

        {rightButton || (showThemeToggle && (
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: colors.surfaceSecondary }]}
            onPress={toggleTheme}
            disabled={isTransitioning}
          >
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: '700', // Made bold for maximum visibility
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
});

export default Header;
