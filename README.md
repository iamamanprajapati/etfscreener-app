# Indian ETF Screener Mobile App

A comprehensive React Native Expo mobile application for analyzing, comparing, and tracking Indian Exchange Traded Funds (ETFs) listed on the National Stock Exchange (NSE).

## Features

### 📊 ETF Dashboard
- Real-time ETF data with live prices and performance metrics
- Advanced filtering and sorting capabilities
- Search functionality by ETF symbol
- Compare mode for selecting multiple ETFs

### 📈 ETF Details
- Comprehensive ETF information and metrics
- Price performance analysis (1W, 1M, 1Y, 2Y returns)
- RSI indicators (Daily, Weekly, Monthly)
- Price and volume data
- Additional valuation metrics

### 🔄 Compare ETFs
- Side-by-side comparison of up to 6 ETFs
- Multiple performance metrics
- Easy selection and filtering
- Real-time data updates

### ⭐ Watchlist
- Personalized ETF watchlist with Firebase authentication
- Google Sign-in integration
- Real-time price tracking
- Easy add/remove functionality

### 🧮 Financial Calculators
- **XIRR Calculator**: Calculate returns for irregular cash flows
- **SIP Calculator**: Monthly SIP investment planning with inflation adjustment
- **CAGR Calculator**: Compound Annual Growth Rate calculation
- **Goal Planning**: Calculate required SIP for financial goals

### 📊 Market Overview
- Sector-wise performance analysis
- Visual performance indicators
- Multiple time period views (1D, 1W, 1M, 1Y)
- Quick market statistics

### 📝 Blog & Insights
- Market analysis and insights
- Investment strategies
- Educational content

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack, Bottom Tabs)
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Authentication**: Firebase Auth with Google Sign-in
- **Database**: Firebase Firestore
- **Caching**: AsyncStorage for offline data
- **UI Components**: Custom components with React Native
- **Icons**: Expo Vector Icons

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn
   - Expo CLI (`npm install -g @expo/cli`)
   - Expo Go app on your mobile device

2. **Clone and Install**
   ```bash
   cd etfscreenerapp
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Update `src/config/firebase.js` with your Firebase config

4. **Run the App**
   ```bash
   npm start
   ```
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js
│   ├── LoadingSpinner.js
│   └── MetricsCards.js
├── screens/            # Screen components
│   ├── DashboardScreen.js
│   ├── ETFDetailScreen.js
│   ├── CompareScreen.js
│   ├── WatchlistScreen.js
│   ├── CalculatorsScreen.js
│   ├── MarketOverviewScreen.js
│   ├── BlogScreen.js
│   └── AboutScreen.js
├── navigation/         # Navigation configuration
│   └── AppNavigator.js
├── contexts/          # React Context providers
│   └── AuthContext.js
├── utils/             # Utility functions
│   ├── helpers.js
│   ├── cache.js
│   ├── symbolUtils.js
│   └── xirr.js
├── config/            # Configuration files
│   └── firebase.js
└── data/              # Static data
    └── etfDescriptions.js
```

## Key Features Implementation

### Data Management
- **Caching Strategy**: Summary data cached for 24 hours, price data for 1 hour
- **Offline Support**: App works with cached data when offline
- **Real-time Updates**: Periodic price updates every 30 seconds

### Authentication
- **Google Sign-in**: Seamless authentication with Firebase
- **User Data**: Watchlist data synced with user account
- **Security**: Secure token management

### Performance
- **Optimized Rendering**: FlatList for efficient list rendering
- **Memoization**: useMemo and useCallback for performance optimization
- **Lazy Loading**: Components loaded as needed

## API Integration

The app integrates with the same backend API as the web version:
- **Summary API**: `/api/summary` - ETF fundamental data
- **Prices API**: `/api/prices` - Real-time price data

## Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

### Code Style
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for better UX

## Deployment

### Android
1. Build APK: `expo build:android`
2. Or use EAS Build: `eas build --platform android`

### iOS
1. Build for iOS: `expo build:ios`
2. Or use EAS Build: `eas build --platform ios`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@etfscreener.com
- Website: https://etfscreener.com

## Disclaimer

This application is for informational purposes only and should not be considered as financial advice. Past performance does not guarantee future results. Please consult with a qualified financial advisor before making investment decisions.
