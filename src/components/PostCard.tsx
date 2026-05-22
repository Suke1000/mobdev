import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Post } from '../types';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; displayName: string };
}

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await api.deletePost(post.id);
            onPostDeleted?.(post.id);
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to delete');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    try {
      await api.likePost(post.id);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    }
  };

  const handleOpenComments = async () => {
    setShowComments(true);
    setLoadingComments(true);
    try {
      const data = await api.getComments(post.id);
      setComments(data);
    } catch (e) {
      console.error('Load comments error:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      const comment = await api.addComment(post.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setCommentCount(c => c + 1);
      setNewComment('');
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAuthorPress = () => {
    // @ts-ignore
    navigation.navigate('user-profile', { userId: post.user?.id });
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress} disabled={loading}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>💪</Text>
          </View>
          <View>
            <Text style={styles.username}>@{post.user?.username}</Text>
            <Text style={styles.timestamp}>{formatTime(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        {post.user?.id === user?.id && (
          <TouchableOpacity onPress={handleDelete} disabled={loading}>
            <Text style={styles.moreMenu}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Image */}
      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getFullImageUrl(post.imageUrl) }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
            {liked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.actionCount, liked && styles.likedCount]}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleOpenComments} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent onRequestClose={() => setShowComments(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalSheet}>
            {/* Modal handle */}
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>COMMENTS</Text>

            {loadingComments ? (
              <ActivityIndicator size="large" color="#FF4D4D" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarEmoji}>💪</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentUsername}>@{item.user.username}</Text>
                      <Text style={styles.commentContent}>{item.content}</Text>
                      <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
                  </View>
                }
              />
            )}

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#444"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!newComment.trim() || submittingComment) && styles.sendBtnDisabled]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                activeOpacity={0.85}
              >
                {submittingComment
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.sendBtnText}>Post</Text>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowComments(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#2A2A2A',
  },
  avatarEmoji: { fontSize: 18 },
  username: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  timestamp: { fontSize: 11, color: '#555', marginTop: 1 },
  moreMenu: { fontSize: 20, color: '#555', paddingHorizontal: 4 },
  content: { fontSize: 14, color: '#DDDDDD', lineHeight: 21, marginBottom: 12 },
  imageContainer: {
    borderRadius: 10, overflow: 'hidden',
    height: 220, marginBottom: 12,
    backgroundColor: '#1A1A1A',
  },
  postImage: { width: '100%', height: '100%' },
  actions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 18 },
  likedIcon: { },
  actionCount: { fontSize: 13, fontWeight: '600', color: '#555' },
  likedCount: { color: '#FF4D4D' },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30,
    maxHeight: '85%',
    borderTopWidth: 1, borderColor: '#2A2A2A',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  commentsList: { maxHeight: 350 },
  commentItem: {
    flexDirection: 'row', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  commentAvatarEmoji: { fontSize: 14 },
  commentBody: { flex: 1 },
  commentUsername: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  commentContent: { fontSize: 13, color: '#CCCCCC', lineHeight: 18 },
  commentTime: { fontSize: 10, color: '#444', marginTop: 4 },
  emptyComments: { paddingVertical: 30, alignItems: 'center' },
  emptyCommentsText: { color: '#555', fontSize: 13 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  closeBtn: {
    marginTop: 10, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#1A1A1A', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  closeBtnText: { color: '#555', fontSize: 14, fontWeight: '700' },
});

export default PostCard;
