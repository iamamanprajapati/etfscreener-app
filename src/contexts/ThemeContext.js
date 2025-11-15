import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always use dark theme
  const isDarkMode = true;
  const isTransitioning = false;
  const nextTheme = null;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Helper function to get colors for a specific theme
  const getColorsForTheme = (darkMode) => ({
    background: darkMode ? '#1f2937' : '#f9fafb',
    surface: darkMode ? '#374151' : '#ffffff',
    surfaceSecondary: darkMode ? '#4b5563' : '#f3f4f6',
    text: darkMode ? '#f9fafb' : '#1f2937',
    textSecondary: darkMode ? '#d1d5db' : '#6b7280',
    border: darkMode ? '#4b5563' : '#e5e7eb',
    borderLight: darkMode ? '#6b7280' : '#f3f4f6',
    primary: darkMode ? 'rgb(6,182,212)' : '#2563eb',
    primaryHeader: darkMode ? 'rgb(6,182,212,.5)' : '#2563eb',
    primaryLight: darkMode ? '#0e7490' : '#dbeafe',
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706',
    info: '#0891b2',
    tableHeader: darkMode ? '#374151' : '#f8fafc',
    tableRow: darkMode ? '#374151' : '#ffffff',
    tableRowSelected: darkMode ? '#0e7490' : '#eff6ff',
    tableBorder: darkMode ? '#4b5563' : '#e5e7eb',
    tableBorderLight: darkMode ? '#6b7280' : '#f3f4f6',
    positive: darkMode ? '#10b981' : '#059669', // Brighter green for dark theme
    negative: '#dc2626',
    rsiOverbought: '#dc2626',
    rsiOversold: darkMode ? '#10b981' : '#059669', // Brighter green for dark theme
    rsiNeutral: darkMode ? '#9ca3af' : '#6b7280',
  });

  const theme = {
    isDarkMode,
    toggleTheme: () => {}, // No-op function for compatibility
    isTransitioning,
    nextTheme,
    fadeOutAnim,
    fadeInAnim,
    colors: getColorsForTheme(isDarkMode),
    nextColors: null,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
