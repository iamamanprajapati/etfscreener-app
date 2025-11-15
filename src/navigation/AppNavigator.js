import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Text from '../components/CustomText';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ETFDetailScreen from '../screens/ETFDetailScreen';
import CompareScreen from '../screens/CompareScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import GlobalMarketScreen from '../screens/GlobalMarketScreen';
import MarketOverviewScreen from '../screens/MarketOverviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  const { colors } = useTheme();
  
  // Helper function to get tab label
  const getTabLabel = (routeName) => {
    const labels = {
      'Dashboard': 'Dashboard',
      'Market': 'Indian',
      'Compare': 'Compare',
      'Watchlist': 'Watchlist',
      'GlobalMarket': 'Global',
    };
    return labels[routeName] || routeName;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Market') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Compare') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Watchlist') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'GlobalMarket') {
            iconName = focused ? 'globe' : 'globe-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          return (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '600' : '400',
                color: color,
                marginTop: 2,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {getTabLabel(route.name)}
            </Text>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Market" component={MarketOverviewScreen} />
      <Tab.Screen name="GlobalMarket" component={GlobalMarketScreen} />
      <Tab.Screen name="Compare" component={CompareScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="ETFDetail" 
        component={ETFDetailScreen}
        options={{
          headerShown: false, // Hide default header to use our custom Header component
        }}
      />
    </Stack.Navigator>
  );
}
