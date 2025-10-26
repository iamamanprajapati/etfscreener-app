import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Animated, View, InteractionManager } from 'react-native';
import { WatchlistProvider } from './src/contexts/WatchlistContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Import Reactotron in development mode
if (__DEV__) {
  require("./ReactotronConfig");
  require("./ReactotronTest");
  require("./src/utils/testWatchlistIntegration");
}

// Try to import and initialize AdMob, but handle gracefully if it fails
let mobileAds = null;
let MaxAdContentRating = null;
try {
  const AdMobModule = require('react-native-google-mobile-ads');
  mobileAds = AdMobModule.default;
  MaxAdContentRating = AdMobModule.MaxAdContentRating;
} catch (error) {
  console.log('AdMob not available:', error.message);
}

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
  useEffect(() => {
    // Test Reactotron connection in development
    if (__DEV__) {
      console.log("🚀 ETF Screener App started - Reactotron should be connected!");
    }
    
    // Defer Google Mobile Ads SDK initialization until after initial interactions
    const task = InteractionManager.runAfterInteractions(() => {
      if (mobileAds && MaxAdContentRating) {
        mobileAds()
          .setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.G,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
            testDeviceIdentifiers: ['EMULATOR'], // Add your device ID here
          })
          .then(() => mobileAds().initialize())
          .then(adapterStatuses => {
            console.log('Google Mobile Ads initialized successfully');
            console.log('Adapter statuses:', adapterStatuses);
          })
          .catch(error => {
            console.log('Failed to initialize Google Mobile Ads:', error);
          });
      }
    });
    return () => task && task.cancel && task.cancel();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WatchlistProvider>
          <AppContent />
        </WatchlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}