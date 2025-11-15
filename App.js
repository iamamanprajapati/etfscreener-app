import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Animated, View, InteractionManager, Modal, TouchableOpacity, Linking } from 'react-native';
import Text from './src/components/CustomText';
import { WatchlistProvider } from './src/contexts/WatchlistContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { fetchForceUpdateConfig } from './src/services/remoteConfig';

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
  const [forceUpdate, setForceUpdate] = useState({ visible: false, title: '', message: '', url: '' });

  useEffect(() => {
    // Defer Remote Config fetch until after initial interactions to improve startup time
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const cfg = await fetchForceUpdateConfig();
          if (cfg.needsUpdate) {
            setForceUpdate({ visible: true, title: cfg.updateTitle, message: cfg.updateMessage, url: cfg.storeUrl });
          }
        } catch (e) {
          // Silent fail – app continues if Remote Config fetch fails
        }
      })();
    });
    return () => task && task.cancel && task.cancel();
  }, []);
  
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
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <NavigationContainer>
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
          <StatusBar style={nextTheme ? "light" : "dark"} />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </Animated.View>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      <Modal transparent visible={forceUpdate.visible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', marginHorizontal: 24, borderRadius: 12, padding: 20, width: '86%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{forceUpdate.title || 'Update Required'}</Text>
            <Text style={{ fontSize: 15, color: '#333', marginBottom: 16 }}>{forceUpdate.message || 'Please update the app to continue.'}</Text>
            <TouchableOpacity
              onPress={() => {
                if (forceUpdate.url) {
                  Linking.openURL(forceUpdate.url);
                }
              }}
              style={{ backgroundColor: '#1e88e5', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    // Test Reactotron connection in development
    if (!__DEV__) {
      console.log("🚀 ETF Screener App started - Reactotron should be connected!");
    }
    
    // Defer Google Mobile Ads SDK initialization until after initial interactions
    const task = InteractionManager.runAfterInteractions(() => {
      if (mobileAds) {
        mobileAds()
          .initialize()
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