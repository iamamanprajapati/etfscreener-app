# Google Auth Production Issues - Troubleshooting Guide

## 🚨 Critical Issues Found & Fixed

### Issue 1: Missing Android Client ID ✅ FIXED
**Problem**: The Google Auth configuration was missing the `androidClientId` property, which is required for Android production builds.

**Solution**: Added `androidClientId` to `src/config/googleAuth.js`

### Issue 2: Environment Variables Not Configured ✅ FIXED
**Problem**: Production builds weren't getting the required environment variables.

**Solution**: Added environment variables to `eas.json` production build configuration.

### Issue 3: Firebase Configuration Not Set ⚠️ NEEDS ACTION
**Problem**: Firebase config still has placeholder values.

**Action Required**: Update `src/config/firebase.js` with your actual Firebase configuration.

## 🔧 Additional Steps Required

### Step 1: Verify Google Cloud Console Configuration

1. **Check OAuth Consent Screen**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Ensure your app is published or add test users

2. **Verify Client IDs**:
   - Check that all three client IDs exist:
     - Web application client
     - iOS application client  
     - Android application client
   - Verify package names and bundle IDs match exactly

3. **Check SHA-1 Fingerprints** (Android):
   ```bash
   # Get debug SHA-1
   cd android && ./gradlew signingReport
   
   # Get release SHA-1 (if using release keystore)
   keytool -list -v -keystore android/app/etfscreener-release.keystore -alias etfscreener
   ```

### Step 2: Test Production Build

1. **Build for production**:
   ```bash
   eas build --platform android --profile production
   ```

2. **Test on physical device**:
   - Install the production build
   - Test Google Sign-In flow
   - Check console logs for errors

### Step 3: Common Production Issues & Solutions

#### Issue: "DEVELOPER_ERROR" on Android
**Cause**: SHA-1 fingerprint mismatch or missing Android client ID
**Solution**: 
- Verify SHA-1 fingerprint in Google Cloud Console
- Ensure Android client ID is configured

#### Issue: "Access denied" error
**Cause**: OAuth consent screen not configured properly
**Solution**:
- Add your email to test users
- Ensure app is published or in testing mode

#### Issue: "Invalid client" error
**Cause**: Client ID mismatch or wrong environment
**Solution**:
- Verify client IDs in Google Cloud Console
- Check environment variables are set correctly

#### Issue: Sign-in works in development but not production
**Cause**: Different client IDs or configurations
**Solution**:
- Use same client IDs for both environments
- Or create separate production client IDs

## 🎯 Testing Checklist

- [ ] Google Sign-In button appears
- [ ] Sign-in flow opens Google authentication
- [ ] User can complete authentication
- [ ] User data is retrieved correctly
- [ ] Sign-out works properly
- [ ] App remembers authentication state

## 📞 Next Steps

1. **Update Firebase configuration** if using Firebase
2. **Test production build** on physical device
3. **Monitor logs** for any remaining errors
4. **Verify backend authentication** is working

## 🔍 Debug Commands

```bash
# Check current Google Sign-In configuration
npx expo run:android --variant release

# View detailed logs
adb logcat | grep -i "google\|auth\|signin"

# Test environment variables
console.log('Web Client ID:', process.env.EXPO_PUBLIC_WEB_CLIENT_ID);
console.log('iOS Client ID:', process.env.EXPO_PUBLIC_IOS_CLIENT_ID);
console.log('Android Client ID:', process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID);
```

The main issues have been fixed. Test the production build and let me know if you encounter any remaining problems!
