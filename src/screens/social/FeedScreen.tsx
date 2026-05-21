import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import PostCard from '../../components/PostCard';
import { Post } from '../../types';

export const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const fetchFeed = useCallback(async (newOffset = 0) => {
    try {
      if (newOffset === 0) setLoading(true);
      const data = await api.getFeed(20, newOffset);
      if (newOffset === 0) {
        setPosts(data);
      } else {
        setPosts((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setOffset(newOffset + 20);
    } catch (error) {
      console.error('Feed fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setPosts([]);
        setOffset(0);
        fetchFeed(0);
      }
    }, [isAuthenticated, fetchFeed])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPosts([]);
    setOffset(0);
    fetchFeed(0);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) fetchFeed(offset);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleCreatePost = () => {
    // @ts-ignore
    navigation.navigate('new-post');
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>PRBOARD</Text>
          <Text style={styles.headerTitle}>Newsfeed</Text>
          <View style={styles.headerAccent} />
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePost} activeOpacity={0.85}>
          <Text style={styles.createButtonIcon}>✏️</Text>
          <Text style={styles.createButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPostDeleted={handlePostDeleted} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4D4D"
            colors={['#FF4D4D']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Follow athletes to see their PRs</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePost}>
              <Text style={styles.emptyButtonText}>Create your first post</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator size="small" color="#FF4D4D" style={styles.footer} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 36,
    height: 3,
    backgroundColor: '#FF4D4D',
    borderRadius: 2,
    marginTop: 5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonIcon: {
    fontSize: 14,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    paddingVertical: 16,
  },
  topBar: {
    padding: 16,
    paddingBottom: 8,
  },
  createPostButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default FeedScreen;
