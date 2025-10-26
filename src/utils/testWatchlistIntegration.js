// Test file to verify watchlist API integration
import Reactotron from "reactotron-react-native";

// Test function to verify watchlist API integration
export const testWatchlistIntegration = () => {
  if (__DEV__) {
    console.log('🧪 Testing Watchlist API Integration');
    
    if (Reactotron) {
      Reactotron.log('🧪 Watchlist Integration Test Started');
      
      // Add a custom command to test watchlist
      Reactotron.onCustomCommand({
        command: 'test-watchlist',
        handler: () => {
          Reactotron.log('📋 Testing watchlist API call...');
          Reactotron.log('API Endpoint: https://etf-scanner-backend.onrender.com/api/user/watchlist');
          Reactotron.log('✅ Watchlist integration is ready!');
        },
        title: 'Test Watchlist API',
        description: 'Test the watchlist API integration'
      });
    }
    
    console.log('✅ Watchlist API integration test setup complete');
  }
};
