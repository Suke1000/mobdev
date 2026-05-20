import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              await api.deletePost(post.id);
              onPostDeleted?.(post.id);
              Alert.alert('Success', 'Post deleted');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAuthorPress = () => {
    if (post.user?.id === user?.id) {
      // Navigate to own profile (Profile tab)
      // @ts-ignore - navigate to user-profile with own userId
      navigation.navigate('user-profile', { userId: user?.id });
    } else {
      // Navigate to other user's profile modal
      // @ts-ignore - navigate to user-profile with params
      navigation.navigate('user-profile', { userId: post.user?.id });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorInfo}
          onPress={handleAuthorPress}
          disabled={loading}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{post.user?.username}</Text>
          </View>
        </TouchableOpacity>

        {post.user?.id === user?.id && (
          <TouchableOpacity onPress={handleDelete} disabled={loading}>
            <Text style={styles.moreMenu}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imagePlaceholder}>📷 Image</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  moreMenu: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  content: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholder: {
    fontSize: 48,
  },
});

export default PostCard;
