import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

const BlogScreen = () => {
  const blogPosts = [
    {
      id: '1',
      title: 'Understanding Indian ETF Market Trends in 2024',
      excerpt: 'A comprehensive analysis of the Indian ETF market performance and emerging trends.',
      date: '2024-01-15',
      readTime: '5 min read',
      category: 'Market Analysis'
    },
    {
      id: '2',
      title: 'How to Choose the Right ETF for Your Portfolio',
      excerpt: 'Learn the key factors to consider when selecting ETFs for your investment portfolio.',
      date: '2024-01-10',
      readTime: '7 min read',
      category: 'Investment Guide'
    },
    {
      id: '3',
      title: 'Sector Rotation Strategies Using ETFs',
      excerpt: 'Discover how to implement sector rotation strategies using Indian ETFs.',
      date: '2024-01-05',
      readTime: '6 min read',
      category: 'Strategy'
    },
    {
      id: '4',
      title: 'Risk Management in ETF Investing',
      excerpt: 'Essential risk management techniques for ETF investors in volatile markets.',
      date: '2024-01-01',
      readTime: '8 min read',
      category: 'Risk Management'
    }
  ];

  const renderBlogPost = (post) => (
    <TouchableOpacity key={post.id} style={styles.blogPost}>
      <View style={styles.postHeader}>
        <Text style={styles.postCategory}>{post.category}</Text>
        <Text style={styles.postDate}>{post.date}</Text>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postExcerpt}>{post.excerpt}</Text>
      <View style={styles.postFooter}>
        <Text style={styles.readTime}>{post.readTime}</Text>
        <Ionicons name="arrow-forward" size={16} color="#2563eb" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Blog" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ETF Insights & Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with the latest trends, strategies, and insights in the Indian ETF market
          </Text>
        </View>

        <View style={styles.blogPosts}>
          {blogPosts.map(renderBlogPost)}
        </View>

        <View style={styles.newsletter}>
          <View style={styles.newsletterContent}>
            <Ionicons name="mail" size={32} color="#2563eb" />
            <Text style={styles.newsletterTitle}>Stay Updated</Text>
            <Text style={styles.newsletterText}>
              Subscribe to our newsletter for the latest ETF market insights and analysis
            </Text>
            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  blogPosts: {
    paddingHorizontal: 16,
  },
  blogPost: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  postExcerpt: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  newsletter: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsletterContent: {
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  newsletterText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BlogScreen;
