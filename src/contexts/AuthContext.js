import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_AUTH_CONFIG } from '../config/googleAuth';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false to not block initial render
  const [error, setError] = useState(null);

  // Configure Google Sign-In and load user data in parallel
  useEffect(() => {
    // Configure immediately (synchronous, fast)
    GoogleSignin.configure(GOOGLE_AUTH_CONFIG);

    // Load user data asynchronously without blocking render
    (async () => {
      // Load from storage first (fastest)
      await loadUserFromStorage();
      // Then check Google Sign-In status (slower, but non-blocking)
      await checkSignInStatus();
    })();
  }, []);

  // Load user from AsyncStorage
  const loadUserFromStorage = async () => {
    try {
      // Load both items in parallel for better performance
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('accessToken')
      ]);
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        authService.setAccessToken(storedToken);
      }
      setLoading(false);
    } catch (error) {
      console.log('Error loading user from storage:', error);
      setLoading(false);
    }
  };

  // Save user to AsyncStorage
  const saveUserToStorage = async (userData, accessToken) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (accessToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
      }
    } catch (error) {
      console.log('Error saving user to storage:', error);
    }
  };

  // Remove user from AsyncStorage
  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
    } catch (error) {
      console.log('Error removing user from storage:', error);
    }
  };

  const checkSignInStatus = async () => {
    try {
      // Check if user is signed in by trying to get current user
      const userInfo = await GoogleSignin.getCurrentUser();
      if (userInfo && userInfo.data) {
        // Try to authenticate with backend using stored token
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (storedToken) {
          authService.setAccessToken(storedToken);
          setUser(userInfo);
        } else {
          // If no stored token, try to re-authenticate with backend
          try {
            const authResult = await authService.authenticateWithGoogle(userInfo);
            if (authResult.success) {
              setUser(userInfo);
              await saveUserToStorage(userInfo, authResult.accessToken);
            }
          } catch (authError) {
            console.log('Backend authentication failed:', authError);
            // Continue with local Google sign-in
            setUser(userInfo);
            await saveUserToStorage(userInfo);
          }
        }
      }
    } catch (error) {
      // User is not signed in, which is normal
      console.log('User not signed in:', error.message);
    }
    // Note: loading is set by loadUserFromStorage, don't set it here to avoid race condition
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();
      
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Google Sign-In successful, authenticating with backend...');
      
      // Authenticate with backend using the Google auth result
      try {
        const authResult = await authService.authenticateWithGoogle(userInfo);
        
        if (authResult.success) {
          console.log('Backend authentication successful');
          setUser(userInfo);
          await saveUserToStorage(userInfo, authResult.accessToken);
          
          // Trigger watchlist load after successful authentication
          console.log('🚀 User authenticated, watchlist will be loaded automatically');
          
          return userInfo;
        } else {
          throw new Error('Backend authentication failed');
        }
      } catch (backendError) {
        console.error('Backend authentication error:', backendError);
        // Fallback to local authentication if backend fails
        console.log('Falling back to local authentication');
        setUser(userInfo);
        await saveUserToStorage(userInfo);
        return userInfo;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      
      // Logout from backend first
      try {
        await authService.logout();
      } catch (backendError) {
        console.log('Backend logout failed, continuing with local logout:', backendError);
      }
      
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear local state
      setUser(null);
      await removeUserFromStorage();
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    authService
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
