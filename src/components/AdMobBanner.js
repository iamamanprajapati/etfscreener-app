import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Try to import AdMob, but handle gracefully if it fails
let AdMobBannerComponent = null;
try {
  const { AdMobBanner } = require('expo-ads-admob');
  AdMobBannerComponent = AdMobBanner;
} catch (error) {
  console.log('AdMob not available:', error.message);
}

const AdMobBanner = ({ style }) => {
  const { colors } = useTheme();
  const [adError, setAdError] = useState(false);

  // Use test ad unit ID for development
  const adUnitId = __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test banner ad unit ID for both platforms
    : 'ca-app-pub-3940256099942544/6300978111'; // Replace with your real ad unit ID

  // If AdMob is not available or there's an error, show a placeholder
  if (!AdMobBannerComponent || adError) {
    return (
      <View style={[styles.container, styles.placeholder, { backgroundColor: colors.surface }, style]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          Ad Space
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      <AdMobBannerComponent
        bannerSize="banner" // Small banner size
        adUnitID={adUnitId}
        servePersonalizedAds={false}
        onDidFailToReceiveAdWithError={(error) => {
          console.log('Banner ad failed to load:', error);
          setAdError(true);
        }}
        onAdViewDidReceiveAd={() => {
          console.log('Banner ad loaded');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  placeholder: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AdMobBanner;
