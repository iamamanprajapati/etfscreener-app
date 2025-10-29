// Google OAuth Configuration
// Replace these with your actual Google OAuth Client IDs from Google Cloud Console

export const GOOGLE_AUTH_CONFIG = {
  // Web Client ID (used on Android and iOS with latest SDK)
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || '1003388477747-7jfu93vgsuori340pe9dlagt3ogpncod.apps.googleusercontent.com',
  
  // Scopes
  scopes: ['profile', 'email'],
  
  // Other configuration
  offlineAccess: true,
  forceCodeForRefreshToken: false,
};

// Instructions for setting up Google OAuth:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Go to "Credentials" and create OAuth 2.0 Client IDs:
//    - Web application (for server-side verification)
//    - iOS application (use your bundle identifier)
//    - Android application (use your package name and SHA-1 fingerprint)
// 5. Copy the Client IDs and replace the values above
// 6. Update the iosUrlScheme in app.json with your iOS Client ID
