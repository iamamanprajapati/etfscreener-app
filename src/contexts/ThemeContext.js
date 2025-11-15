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
    background: darkMode ? '#0f172a' : '#f9fafb', // Rich slate-900 background
    surface: darkMode ? '#1e293b' : '#ffffff', // Slate-800 surface with subtle blue tint
    surfaceSecondary: darkMode ? '#334155' : '#f3f4f6', // Slate-700 for secondary surfaces
    text: darkMode ? '#f1f5f9' : '#1f2937', // Slate-100 for better contrast
    textSecondary: darkMode ? '#cbd5e1' : '#6b7280', // Slate-300 for secondary text
    border: darkMode ? '#475569' : '#e5e7eb', // Slate-600 for borders
    borderLight: darkMode ? '#64748b' : '#f3f4f6', // Slate-500 for light borders
    primary: darkMode ? '#5b9bfd' : '#5b9bfd', // Custom blue #5b9bfd
    primaryHeader: darkMode ? 'rgba(91,155,253,0.5)' : '#5b9bfd', // #5b9bfd with opacity
    primaryLight: darkMode ? '#3d7ae8' : '#dbeafe', // Darker shade of #5b9bfd for light primary
    symbol: '#5b9bfd', // Custom blue for ETF symbols
    success: '#10b981', // Emerald-500
    error: '#ef4444', // Red-500
    warning: '#f59e0b', // Amber-500
    info: '#06b6d4', // Cyan-500
    tableHeader: darkMode ? '#1e293b' : '#f8fafc', // Slate-800
    tableRow: darkMode ? '#1e293b' : '#ffffff', // Slate-800
    tableRowSelected: darkMode ? '#3d7ae8' : '#eff6ff', // Darker shade of #5b9bfd for selected rows
    tableBorder: darkMode ? '#475569' : '#e5e7eb', // Slate-600
    tableBorderLight: darkMode ? '#64748b' : '#f3f4f6', // Slate-500
    positive: darkMode ? '#22c55e' : '#059669', // Green-500 for dark theme
    negative: '#ef4444', // Red-500
    rsiOverbought: '#ef4444', // Red-500
    rsiOversold: darkMode ? '#22c55e' : '#059669', // Green-500 for dark theme
    rsiNeutral: darkMode ? '#94a3b8' : '#6b7280', // Slate-400
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
