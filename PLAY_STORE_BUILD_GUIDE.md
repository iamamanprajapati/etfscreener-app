# Play Store Build & Submission Guide

This guide will walk you through building and submitting your Indian ETF Screener app to the Google Play Store.

## Prerequisites

- Completed Firebase setup (see FIREBASE_SETUP_GUIDE.md)
- Google Play Console account ($25 one-time registration fee)
- EAS CLI installed globally
- All app assets ready (icons, screenshots, etc.)

## Step 1: Install EAS CLI and Login

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# If you don't have an Expo account, create one at https://expo.dev
```

## Step 2: Configure EAS Build

```bash
# Navigate to your project directory
cd /Users/innovationm-admin/Desktop/personal-project/etfscreener/etfscreenerapp

# Initialize EAS configuration
eas build:configure
```

This will create an `eas.json` file. Update it with the following configuration:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 3: Update app.json with EAS Project ID

After running `eas build:configure`, you'll get a project ID. Update your `app.json`:

```json
{
  "expo": {
    // ... other config
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id-here"
      }
    }
  }
}
```

## Step 4: Prepare Firebase Configuration

1. **Add google-services.json**
   - Download from Firebase Console
   - Place in project root (same level as app.json)
   - **IMPORTANT**: Add to .gitignore to avoid committing sensitive data

2. **Update .gitignore**
   ```
   # Firebase
   google-services.json
   google-services.json.bak
   
   # Environment variables
   .env
   .env.local
   .env.production
   ```

## Step 5: Build for Production

### Option A: Build Android App Bundle (AAB) - Recommended
```bash
# Build production AAB for Play Store
eas build --platform android --profile production
```

### Option B: Build APK for Testing
```bash
# Build APK for internal testing
eas build --platform android --profile preview
```

## Step 6: Monitor Build Progress

- The build will run on Expo's servers
- You can monitor progress in the terminal or at [expo.dev](https://expo.dev)
- Build typically takes 10-15 minutes
- You'll get a download link when complete

## Step 7: Test Your Build

1. **Download the AAB/APK**
2. **Install on Android device**
   ```bash
   # For APK
   adb install your-app.apk
   
   # For AAB, you'll need to upload to Play Console first
   ```

3. **Test all features**:
   - App launches correctly
   - Google Sign-In works
   - Watchlist functionality
   - All screens load properly
   - No crashes or errors

## Step 8: Prepare Play Store Assets

### Required Assets

1. **App Icon** ✅ (Already have: 512x512px)
2. **Feature Graphic** ⚠️ (Need to create: 1024x500px)
3. **Screenshots** ⚠️ (Need to create: at least 2, up to 8)
4. **Privacy Policy URL** ✅ (Created: PRIVACY_POLICY.md)

### Create Feature Graphic
- Size: 1024x500px
- Format: PNG or JPEG
- Content: App name, key features, attractive design
- Tools: Canva, Figma, or Photoshop

### Create Screenshots
Take screenshots of your app on different screen sizes:
- Phone screenshots (at least 2)
- Tablet screenshots (optional but recommended)
- Show key features: Dashboard, ETF Details, Watchlist, etc.

## Step 9: Google Play Console Setup

### Create New App
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - **App name**: Indian ETF Screener
   - **Default language**: English (India)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all applicable boxes

### App Content
1. **App category**: Finance
2. **Content rating**: Complete questionnaire
3. **Target audience**: 18+ (for financial apps)
4. **Ads**: Declare if you show ads

## Step 10: Upload Your App

### Upload AAB
1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload your AAB file
4. Add release notes
5. Review and rollout

### App Information
Fill in all required fields:

**Store listing**:
- Short description (80 chars max)
- Full description (4000 chars max)
- Screenshots
- Feature graphic
- App icon

**Content rating**:
- Complete the questionnaire
- Submit for rating

**Pricing & distribution**:
- Set as free
- Select countries (India + others)
- Device categories

## Step 11: Data Safety Form

**Critical for Play Store approval**:

1. **Data collection**:
   - ✅ Email addresses (for authentication)
   - ✅ App activity (usage analytics)
   - ✅ Device or other IDs

2. **Data sharing**:
   - ✅ With third parties (Firebase/Google)
   - ✅ For advertising (if applicable)

3. **Security practices**:
   - ✅ Data is encrypted in transit
   - ✅ Users can request data deletion

## Step 12: Privacy Policy Setup

1. **Host your privacy policy**:
   - Upload PRIVACY_POLICY.md to your website
   - Or use GitHub Pages, Netlify, etc.
   - Get a public URL

2. **Add to Play Console**:
   - Go to "Policy" → "App content"
   - Add privacy policy URL
   - Add terms of service URL (optional but recommended)

## Step 13: Final Review and Submit

### Pre-submission Checklist
- [ ] AAB uploaded successfully
- [ ] All required fields filled
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Privacy policy URL added
- [ ] Data safety form completed
- [ ] Content rating completed
- [ ] App tested thoroughly
- [ ] No placeholder text or images
- [ ] Firebase configuration working
- [ ] All features functional

### Submit for Review
1. Click "Review release"
2. Address any warnings or errors
3. Submit for review
4. Wait for Google's review (typically 1-3 days)

## Step 14: Post-Submission

### Monitor Review Status
- Check Play Console regularly
- Respond to any feedback from Google
- Be prepared to make changes if requested

### Common Rejection Reasons & Solutions

1. **Missing Privacy Policy**
   - Solution: Ensure privacy policy URL is accessible and complete

2. **Incomplete Data Safety Form**
   - Solution: Accurately describe all data collection and sharing

3. **App Crashes or Poor Performance**
   - Solution: Test thoroughly on multiple devices

4. **Misleading Financial Claims**
   - Solution: Ensure disclaimers are prominent and accurate

5. **Insufficient App Description**
   - Solution: Provide detailed, accurate description of features

## Step 15: Release Management

### Staged Rollout
- Start with 20% of users
- Monitor crash reports and user feedback
- Gradually increase to 100%

### Updates
For future updates:
1. Increment version in app.json
2. Increment versionCode in app.json
3. Build new AAB: `eas build --platform android --profile production`
4. Upload to Play Console

## Troubleshooting

### Build Issues
```bash
# Clear EAS cache
eas build --clear-cache

# Check build logs
eas build:list
eas build:view [build-id]
```

### Upload Issues
- Ensure AAB file is not corrupted
- Check file size limits (100MB max)
- Verify signing configuration

### Review Issues
- Read Google's feedback carefully
- Make requested changes
- Resubmit with clear explanations

## Support Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

## Cost Breakdown

- **Google Play Console**: $25 (one-time)
- **EAS Build**: Free tier available, paid plans for more builds
- **Firebase**: Free tier available, paid for higher usage
- **Total estimated cost**: $25-50 for initial setup

---

**Remember**: The review process can take 1-3 days. Be patient and ensure all requirements are met before submission. Good luck with your app launch! 🚀
