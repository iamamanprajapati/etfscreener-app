import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

const AboutScreen = () => {
  const handleContactPress = () => {
    Linking.openURL('mailto:support@etfscreener.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://etfscreener.com');
  };

  const features = [
    {
      icon: 'bar-chart',
      title: 'Real-time Data',
      description: 'Get live ETF prices and performance data from NSE'
    },
    {
      icon: 'search',
      title: 'Advanced Screening',
      description: 'Filter and sort ETFs by various metrics and criteria'
    },
    {
      icon: 'trending-up',
      title: 'Market Analysis',
      description: 'Comprehensive market overview and sector performance'
    },
    {
      icon: 'calculator',
      title: 'Financial Tools',
      description: 'XIRR, SIP, CAGR calculators for investment planning'
    },
    {
      icon: 'star',
      title: 'Watchlist',
      description: 'Track your favorite ETFs with personalized watchlists'
    },
    {
      icon: 'swap-horizontal',
      title: 'Compare ETFs',
      description: 'Side-by-side comparison of multiple ETFs'
    }
  ];

  const renderFeature = (feature, index) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon} size={24} color="#2563eb" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="About" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Indian ETF Screener</Text>
          <Text style={styles.heroSubtitle}>
            Your comprehensive platform for Indian ETF analysis and investment planning
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This App</Text>
          <Text style={styles.sectionText}>
            The Indian ETF Screener is a powerful mobile application designed to help investors 
            analyze, compare, and track Exchange Traded Funds (ETFs) listed on the National Stock 
            Exchange (NSE) of India. Our platform provides real-time data, advanced screening 
            capabilities, and comprehensive financial tools to support your investment decisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            {features.map(renderFeature)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sources</Text>
          <Text style={styles.sectionText}>
            Our app fetches real-time data from reliable sources including NSE (National Stock Exchange) 
            and other authorized data providers. We ensure data accuracy and timely updates to provide 
            you with the most current market information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={styles.sectionText}>
            This application is for informational purposes only and should not be considered as 
            financial advice. Past performance does not guarantee future results. Please consult 
            with a qualified financial advisor before making investment decisions. The data provided 
            is sourced from third parties and we do not guarantee its accuracy or completeness.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionText}>
            Have questions or feedback? We'd love to hear from you!
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleWebsitePress}>
              <Ionicons name="globe" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Visit Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Indian ETF Screener. All rights reserved.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default AboutScreen;
