import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/theme';
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
    if (hasMore && !loading) {
      fetchFeed(offset);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleCreatePost = () => {
    // @ts-ignore - navigate to new-post screen
    navigation.navigate('new-post');
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Create Post Button at Top */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.createPostButton} onPress={handleCreatePost}>
          <Text style={styles.createPostButtonText}>✏️ Create Post</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPostDeleted={handlePostDeleted} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Follow users to see their posts</Text>
          </View>
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator size="small" color="#FF6B6B" style={styles.footer} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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