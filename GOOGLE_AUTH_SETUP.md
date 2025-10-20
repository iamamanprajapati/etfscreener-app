# Google Authentication Setup Guide

This guide will help you set up Google Authentication for your ETF Screener app.

## Prerequisites

1. A Google Cloud Console account
2. Your app's bundle identifier (iOS) and package name (Android)
3. SHA-1 fingerprint for Android (if building for Android)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Sign-In API" if available

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Indian ETF Screener"
   - User support email: Your email
   - Developer contact information: Your email
4. Add test users (emails that can test the app)
5. Save and continue through all steps

## Step 4: Create OAuth 2.0 Client IDs

### For Web Application (Server-side verification)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:8081` (for development)
   - Your production domain (if applicable)
5. Add authorized redirect URIs:
   - `http://localhost:8081` (for development)
   - Your production domain (if applicable)
6. Copy the Client ID

### For iOS Application
1. Click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "iOS"
3. Bundle ID: `com.etfscreener.indianetf` (from your app.json)
4. Copy the Client ID
5. Note the iOS URL scheme (e.g., `com.googleusercontent.apps.YOUR_CLIENT_ID`)

### For Android Application
1. Click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "Android"
3. Package name: `com.etfscreener.indianetf` (from your app.json)
4. SHA-1 certificate fingerprint: Get this by running:
   ```bash
   cd android && ./gradlew signingReport
   ```
   Look for the SHA1 fingerprint in the debug keystore section
5. Copy the Client ID

## Step 5: Update Configuration

1. Open `src/config/googleAuth.js`
2. Replace the placeholder values with your actual Client IDs:
   ```javascript
   export const GOOGLE_AUTH_CONFIG = {
     webClientId: 'your_actual_web_client_id',
     iosClientId: 'your_actual_ios_client_id',
     androidClientId: 'your_actual_android_client_id',
     // ... rest of config
   };
   ```

3. Update `app.json` with your iOS URL scheme:
   ```json
   {
     "plugins": [
       [
         "@react-native-google-signin/google-signin",
         {
           "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
         }
       ]
     ]
   }
   ```

## Step 6: Test the Implementation

1. Run `npx expo prebuild --clean` to regenerate native code
2. Build and run your app:
   - For iOS: `npx expo run:ios`
   - For Android: `npx expo run:android`
3. Navigate to the Watchlist screen
4. You should see the Google Sign-In button
5. Test the sign-in and sign-out functionality

## Troubleshooting

### Common Issues:

1. **"DEVELOPER_ERROR" on Android**: 
   - Make sure your SHA-1 fingerprint is correct
   - Regenerate the fingerprint and update it in Google Console

2. **"Sign in with Google does not work with expo-go"**:
   - You need to use a development build, not Expo Go
   - Run `npx expo run:ios` or `npx expo run:android`

3. **"Access denied" error**:
   - Make sure the test user email is added to the OAuth consent screen
   - Check if the app is in testing mode

4. **"Could not resolve com.github.Dimezis:BlurView"**:
   - Update your Expo version
   - Run `npx expo install --fix`

## Security Notes

- Never commit your actual Client IDs to version control
- Use environment variables for production
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Console for any suspicious activity

## Next Steps

Once Google Authentication is working:
1. You can customize the sign-in UI
2. Add user profile management
3. Implement server-side token verification
4. Add additional OAuth scopes if needed
