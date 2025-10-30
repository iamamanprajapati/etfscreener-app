import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Try to import AdMob, but handle gracefully if it fails
let BannerAd = null;
let TestIds = null;
let mobileAds = null;
let BannerAdSize = null;
try {
  const AdMobModule = require('react-native-google-mobile-ads');
  BannerAd = AdMobModule.BannerAd;
  TestIds = AdMobModule.TestIds;
  mobileAds = AdMobModule.default;
  BannerAdSize = AdMobModule.BannerAdSize;
} catch (error) {
  console.log('AdMob not available:', error.message);
}

const AdMobBanner = ({ style }) => {
  const { colors } = useTheme();
  const [adError, setAdError] = useState(false);

  // Use test ads for development, real ads for production (platform-specific)
  const productionAdUnitId = Platform.OS === 'ios'
    ? 'ca-app-pub-4785007038647034/9389395735' // iOS banner unit
    : 'ca-app-pub-4785007038647034/7284719998'; // Android banner unit

  const adUnitId = __DEV__
    ? (TestIds ? TestIds.BANNER : 'ca-app-pub-3940256099942544/6300978111')
    : productionAdUnitId;

  // If AdMob is not available or there's an error, don't show anything
  if (!BannerAd || adError) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize ? BannerAdSize.ANCHORED_ADAPTIVE_BANNER : 'LARGE_BANNER'}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
          setAdError(false);
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
          console.log('Error code:', error.code);
          console.log('Error message:', error.message);
          setAdError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    // Let AdMob handle its own sizing
  },
});

export default AdMobBanner;
