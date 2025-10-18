# Firebase Setup Guide for Indian ETF Screener

This guide will help you set up Firebase for your Indian ETF Screener app to enable authentication and data storage features.

## Prerequisites

- Google account
- Firebase project access
- Android app package name: `com.etfscreener.indianetf`

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project" or "Add project"
   - Project name: `Indian ETF Screener` (or your preferred name)
   - Enable Google Analytics (recommended)
   - Choose or create Analytics account
   - Click "Create project"

## Step 2: Add Android App to Firebase

1. **Add Android App**
   - In your Firebase project dashboard, click "Add app"
   - Select Android icon
   - **Android package name**: `com.etfscreener.indianetf`
   - **App nickname**: `Indian ETF Screener`
   - **Debug signing certificate SHA-1**: (Optional for development)

2. **Download Configuration File**
   - Download `google-services.json`
   - **IMPORTANT**: Do NOT commit this file to version control
   - Place it in your project root (same level as app.json)

## Step 3: Enable Authentication

1. **Navigate to Authentication**
   - In Firebase Console, go to "Authentication" → "Sign-in method"

2. **Enable Google Sign-In**
   - Click on "Google" provider
   - Toggle "Enable"
   - **Project support email**: Enter your email
   - **Web SDK configuration**: 
     - Web client ID: (Copy this for later use)
     - Web client secret: (Copy this for later use)
   - Click "Save"

3. **Configure OAuth Consent Screen** (if prompted)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Fill in required information:
     - App name: `Indian ETF Screener`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (for development)

## Step 4: Enable Firestore Database

1. **Create Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select location: `asia-south1` (Mumbai) or closest to your users
   - Click "Done"

2. **Configure Security Rules** (Important for production)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Watchlist data
       match /watchlists/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Step 5: Update Firebase Configuration

1. **Get Firebase Config**
   - In Firebase Console, go to "Project Settings" (gear icon)
   - Scroll down to "Your apps" section
   - Click on your Android app
   - Copy the config values

2. **Update firebase.js**
   Replace the placeholder values in `src/config/firebase.js`:

   ```javascript
   import { initializeApp } from 'firebase/app';
   import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   // Replace with your actual Firebase configuration
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Your API Key
     authDomain: "your-project-id.firebaseapp.com",   // Your Auth Domain
     projectId: "your-project-id",                    // Your Project ID
     storageBucket: "your-project-id.appspot.com",    // Your Storage Bucket
     messagingSenderId: "123456789012",               // Your Messaging Sender ID
     appId: "1:123456789012:android:abcdef1234567890" // Your App ID
   };

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);

   // Initialize Firebase Authentication with AsyncStorage persistence
   export const auth = initializeAuth(app, {
     persistence: getReactNativePersistence(AsyncStorage)
   });
   export const googleProvider = new GoogleAuthProvider();

   // Initialize Cloud Firestore and get a reference to the service
   export const db = getFirestore(app);

   export default app;
   ```

## Step 6: Install Required Dependencies

Make sure you have all required Firebase dependencies in your `package.json`:

```bash
npm install firebase @react-native-async-storage/async-storage
```

## Step 7: Configure EAS Build (for Production)

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to EAS**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```

4. **Update app.json with EAS Project ID**
   - After running `eas build:configure`, you'll get a project ID
   - Update the `extra.eas.projectId` in your `app.json`

## Step 8: Test Firebase Integration

1. **Test Authentication**
   - Run your app: `npm start`
   - Try signing in with Google
   - Check Firebase Console → Authentication → Users

2. **Test Firestore**
   - Add items to your watchlist
   - Check Firebase Console → Firestore Database → Data

## Step 9: Production Configuration

### Security Rules for Production
Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Watchlist data - users can only access their own
    match /watchlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public ETF data (read-only)
    match /etfData/{document} {
      allow read: if true;
      allow write: if false; // Only admin can write
    }
  }
}
```

### Environment Variables (Optional)
For better security, consider using environment variables:

1. **Install expo-constants**
   ```bash
   npm install expo-constants
   ```

2. **Create .env file** (add to .gitignore)
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   ```

3. **Update firebase.js to use environment variables**
   ```javascript
   import Constants from 'expo-constants';
   
   const firebaseConfig = {
     apiKey: Constants.expoConfig.extra.firebaseApiKey,
     authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
     projectId: Constants.expoConfig.extra.firebaseProjectId,
     // ... other config
   };
   ```

## Troubleshooting

### Common Issues

1. **"Firebase App named '[DEFAULT]' already exists"**
   - Solution: Make sure you're only initializing Firebase once

2. **Google Sign-In not working**
   - Check SHA-1 fingerprint in Firebase Console
   - Verify OAuth consent screen configuration
   - Ensure correct package name

3. **Firestore permission denied**
   - Check security rules
   - Verify user is authenticated
   - Check data structure matches rules

4. **Build errors with Firebase**
   - Ensure google-services.json is in project root
   - Check all dependencies are installed
   - Verify Firebase config values

### Getting SHA-1 Fingerprint

For development:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For production (EAS Build):
```bash
eas credentials
```

## Security Best Practices

1. **Never commit sensitive files**
   - Add `google-services.json` to `.gitignore`
   - Use environment variables for sensitive config

2. **Implement proper security rules**
   - Restrict access to user data
   - Validate data on both client and server

3. **Monitor usage**
   - Set up Firebase monitoring
   - Monitor authentication attempts
   - Track database usage

4. **Regular updates**
   - Keep Firebase SDK updated
   - Review and update security rules
   - Monitor for security advisories

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Review Firebase documentation
3. Check Expo documentation for React Native Firebase setup
4. Contact Firebase support if needed

---

**Important**: Keep your Firebase configuration secure and never expose sensitive keys in client-side code or public repositories.
