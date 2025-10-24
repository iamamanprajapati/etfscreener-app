import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_AUTH_CONFIG } from '../config/googleAuth';

// Configure Google Sign-In
GoogleSignin.configure(GOOGLE_AUTH_CONFIG);

const GoogleSignInComponent = ({ onSignIn, user, loading = false }) => {
  const { colors } = useTheme();
  const { signInWithGoogle } = useAuth();

  const signIn = async () => {
    try {
      // Use the AuthContext signInWithGoogle method which handles backend authentication
      const userInfo = await signInWithGoogle();
      
      console.log('Authentication Success:', userInfo);
      
      // Call the parent component's onSignIn callback
      if (onSignIn) {
        onSignIn(userInfo);
      }
    } catch (error) {
      console.log('Authentication Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        console.log('Google Sign-In in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        // Some other error happened
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      }
    }
  };


  if (user) {
    return (
      <View style={[styles.userContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.userInfo}>
          {user.user?.photo && (
            <Image source={{ uri: user.user.photo }} style={styles.userAvatar} />
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.user?.name || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.user?.email || ''}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <Ionicons name="star-outline" size={64} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>
          Sign in to access your watchlist
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Save your favorite ETFs and track their performance
        </Text>
        
        <View style={styles.buttonContainer}>
          <GoogleSigninButton
            style={styles.googleButton}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn}
            disabled={loading}
          />
        </View>
        
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  googleButton: {
    width: 250,
    height: 50,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  userContainer: {
    padding: 20,
    borderRadius: 12,
    margin: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
});

export default GoogleSignInComponent;
