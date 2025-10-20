# Complete Google OAuth Setup Guide

## 🚨 Current Status
The app is now configured with **demo credentials** that will show the Google Sign-In UI but won't actually authenticate users. You need to replace these with real Google OAuth credentials.

## 📋 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ETF Screener App"
4. Click "Create"

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google+ API** (or Google Sign-In API)
   - **Google Identity API**

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - **App name**: "Indian ETF Screener"
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. In "Scopes" section, click "Add or Remove Scopes"
   - Add: `../auth/userinfo.email`
   - Add: `../auth/userinfo.profile`
6. Click "Save and Continue"
7. In "Test users" section, add your email address
8. Click "Save and Continue" through all remaining steps

### Step 4: Create OAuth 2.0 Client IDs

#### 4.1 Web Application Client
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Name: "ETF Screener Web Client"
5. Add authorized JavaScript origins:
   - `http://localhost:8081`
   - `http://localhost:19006`
6. Add authorized redirect URIs:
   - `http://localhost:8081`
   - `http://localhost:19006`
7. Click "Create"
8. **Copy the Client ID** (you'll need this)

#### 4.2 iOS Application Client
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Select "iOS"
3. Name: "ETF Screener iOS Client"
4. Bundle ID: `com.etfscreener.indianetf`
5. Click "Create"
6. **Copy the Client ID** (you'll need this)
7. **Copy the iOS URL scheme** from the "Additional information" section

#### 4.3 Android Application Client
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Select "Android"
3. Name: "ETF Screener Android Client"
4. Package name: `com.etfscreener.indianetf`
5. SHA-1 certificate fingerprint: Get this by running:
   ```bash
   cd android && ./gradlew signingReport
   ```
   Look for the SHA1 fingerprint in the debug keystore section
6. Click "Create"
7. **Copy the Client ID** (you'll need this)

### Step 5: Update Your App Configuration

#### 5.1 Update Google Auth Config
Edit `src/config/googleAuth.js`:

```javascript
export const GOOGLE_AUTH_CONFIG = {
  // Replace with your actual Client IDs
  webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID',
  iosClientId: 'YOUR_ACTUAL_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ACTUAL_ANDROID_CLIENT_ID',
  
  scopes: ['profile', 'email'],
  offlineAccess: true,
  forceCodeForRefreshToken: false,
};
```

#### 5.2 Update app.json
Edit `app.json`:

```json
{
  "expo": {
    "ios": {
      "urlSchemes": ["com.googleusercontent.apps.YOUR_ACTUAL_IOS_CLIENT_ID"]
    },
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_ACTUAL_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### Step 6: Rebuild and Test

1. **Clean and rebuild**:
   ```bash
   npx expo prebuild --clean
   ```

2. **Run the app**:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

3. **Test the sign-in flow**:
   - Navigate to Watchlist screen
   - Tap "Sign in with Google"
   - Complete the authentication flow

## 🔍 Troubleshooting

### Common Issues:

1. **"Your app is missing support for the following URL schemes"**
   - Make sure the `iosUrlScheme` in app.json matches your iOS Client ID
   - Ensure `urlSchemes` is added to the iOS configuration

2. **"DEVELOPER_ERROR" on Android**
   - Verify your SHA-1 fingerprint is correct
   - Make sure the package name matches exactly

3. **"Access denied" error**
   - Add your email to the test users in OAuth consent screen
   - Make sure the app is in testing mode

4. **"Could not resolve com.github.Dimezis:BlurView"**
   - Run `npx expo install --fix`
   - Update Expo version if needed

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] OAuth consent screen configured
- [ ] Web Client ID created and copied
- [ ] iOS Client ID created and copied
- [ ] Android Client ID created and copied
- [ ] SHA-1 fingerprint obtained for Android
- [ ] `src/config/googleAuth.js` updated with real Client IDs
- [ ] `app.json` updated with real iOS URL scheme
- [ ] App rebuilt with `npx expo prebuild --clean`
- [ ] App tested on device/simulator

## 🎯 Expected Result

Once properly configured, you should be able to:
1. See the Google Sign-In button on the Watchlist screen
2. Tap it to open the Google Sign-In flow
3. Complete authentication with your Google account
4. Access the full watchlist functionality
5. Sign out and sign back in

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all Client IDs are correct
3. Ensure the app is rebuilt after configuration changes
4. Test on a physical device (simulator may have limitations)

The demo configuration will show you the UI but won't actually authenticate users. Follow this guide to get full functionality!
