import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Text from './CustomText';

const LoadingSpinner = ({ 
  size = 'small', 
  text = 'Loading...', 
  compact = false,
  color = null 
}) => {
  const { colors } = useTheme();
  const spinnerSize = size === 'large' ? 'large' : 'small';
  const spinnerColor = color || colors.primary;
  
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      {text && (
        <Text style={[styles.text, compact && styles.compactText, { color: colors.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  compact: {
    flex: 0,
    padding: 10,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
  compactText: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default LoadingSpinner;
