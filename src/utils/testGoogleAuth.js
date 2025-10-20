// Test utility for Google Authentication configuration
import { GOOGLE_AUTH_CONFIG } from '../config/googleAuth';

export const testGoogleAuthConfig = () => {
  console.log('Google Auth Configuration Test:');
  console.log('Web Client ID:', GOOGLE_AUTH_CONFIG.webClientId);
  console.log('iOS Client ID:', GOOGLE_AUTH_CONFIG.iosClientId);
  console.log('Android Client ID:', GOOGLE_AUTH_CONFIG.androidClientId);
  console.log('Scopes:', GOOGLE_AUTH_CONFIG.scopes);
  
  // Check if configuration is properly set
  const hasWebClientId = GOOGLE_AUTH_CONFIG.webClientId && 
    GOOGLE_AUTH_CONFIG.webClientId !== 'your_web_client_id_here';
  const hasIosClientId = GOOGLE_AUTH_CONFIG.iosClientId && 
    GOOGLE_AUTH_CONFIG.iosClientId !== 'your_ios_client_id_here';
  const hasAndroidClientId = GOOGLE_AUTH_CONFIG.androidClientId && 
    GOOGLE_AUTH_CONFIG.androidClientId !== 'your_android_client_id_here';
  
  console.log('Configuration Status:');
  console.log('✓ Web Client ID configured:', hasWebClientId);
  console.log('✓ iOS Client ID configured:', hasIosClientId);
  console.log('✓ Android Client ID configured:', hasAndroidClientId);
  
  if (!hasWebClientId || !hasIosClientId || !hasAndroidClientId) {
    console.warn('⚠️  Please update your Google OAuth Client IDs in src/config/googleAuth.js');
    console.warn('   Follow the setup guide in GOOGLE_AUTH_SETUP.md');
  } else {
    console.log('✅ Google Auth configuration looks good!');
  }
  
  return {
    isConfigured: hasWebClientId && hasIosClientId && hasAndroidClientId,
    hasWebClientId,
    hasIosClientId,
    hasAndroidClientId
  };
};