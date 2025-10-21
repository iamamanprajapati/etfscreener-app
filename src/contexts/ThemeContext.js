import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'app_theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextTheme, setNextTheme] = useState(null);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.warn('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      setIsTransitioning(true);
      const newTheme = !isDarkMode;
      setNextTheme(newTheme);
      
      // Reset animations
      fadeOutAnim.setValue(1);
      fadeInAnim.setValue(0);
      
      // Telegram-style cross-fade animation
      Animated.parallel([
        // Fade out current theme
        Animated.timing(fadeOutAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade in new theme
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Complete the transition
        setIsDarkMode(newTheme);
        setNextTheme(null);
        setIsTransitioning(false);
        fadeOutAnim.setValue(1);
        fadeInAnim.setValue(0);
      });
      
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Error saving theme preference:', error);
      setIsTransitioning(false);
      setNextTheme(null);
      fadeOutAnim.setValue(1);
      fadeInAnim.setValue(0);
    }
  };

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
    toggleTheme,
    isTransitioning,
    nextTheme,
    fadeOutAnim,
    fadeInAnim,
    colors: getColorsForTheme(isDarkMode),
    nextColors: nextTheme !== null ? getColorsForTheme(nextTheme) : null,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
