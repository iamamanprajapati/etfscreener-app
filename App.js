import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Animated, View } from 'react-native';
import { WatchlistProvider } from './src/contexts/WatchlistContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isDarkMode, isTransitioning, nextTheme, fadeOutAnim, fadeInAnim, colors, nextColors } = useTheme();
  
  if (isTransitioning && nextColors) {
    return (
      <View style={{ flex: 1 }}>
        {/* Current theme layer */}
        <Animated.View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            opacity: fadeOutAnim 
          }}
        >
          <NavigationContainer>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <AppNavigator />
          </NavigationContainer>
        </Animated.View>
        
        {/* Next theme layer */}
        <Animated.View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            opacity: fadeInAnim 
          }}
        >
          <NavigationContainer>
            <StatusBar style={nextTheme ? "light" : "dark"} />
            <AppNavigator />
          </NavigationContainer>
        </Animated.View>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <AppContent />
      </WatchlistProvider>
    </ThemeProvider>
  );
}