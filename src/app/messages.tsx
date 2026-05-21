import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Conversation, User } from '../types';

type ConversationWithUser = Conversation;

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data);

      const mutuals = await api.getMutualFollowers();
      const existingIds = data.map((c: Conversation) => c.otherUser.id);
      setMutualFollowers(mutuals.filter((m: User) => !existingIds.includes(m.id)));
    } catch (e) {
      console.error('Conversations fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchConversations();
    }, [isAuthenticated, fetchConversations])
  );

  const handleConversationPress = (conversation: ConversationWithUser) => {
    console.log('messages clicked:', {
      userId: conversation.otherUser.id,
      username: conversation.otherUser.username,
    });

    router.push({
      pathname: '/chat',
      params: {
        userId: conversation.otherUser.id,
        username: conversation.otherUser.username,
      },
    });
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMutualFollowers = mutualFollowers.filter(
    (m) =>
      m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerAccent} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchConversations}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => {
              console.log('ConversationItem pressed:', item.otherUser?.id);
              handleConversationPress(item);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarEmoji}>💪</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.conversationInfo}>
              <Text style={styles.conversationName}>
                {item.otherUser.displayName || item.otherUser.username}
              </Text>
              <Text style={styles.conversationHandle}>@{item.otherUser.username}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          filteredMutualFollowers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Follow users who follow you back to start messaging
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          filteredMutualFollowers.length > 0 ? (
            <View style={styles.mutualSection}>
              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.sectionTitle}>MUTUAL FOLLOWERS</Text>
                <View style={styles.dividerLine} />
              </View>
              {filteredMutualFollowers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.mutualItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert('Start Conversation', `Send a message to ${user.username}?`);
                    router.push({
                      pathname: '/chat',
                      params: { userId: user.id, username: user.username },
                    });
                  }}
                >
                  <View style={styles.mutualAvatar}>
                    <Text style={styles.avatarEmoji}>💪</Text>
                  </View>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationName}>{user.displayName || user.username}</Text>
                    <Text style={styles.conversationHandle}>@{user.username}</Text>
                  </View>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>MSG</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#FF4D4D',
    borderRadius: 2,
    marginTop: 6,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: '3%',
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0F0F0F',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  conversationHandle: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#FF4D4D',
    fontWeight: '700',
    lineHeight: 22,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  mutualSection: {
    marginTop: 8,
    paddingBottom: 20,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4D4D',
    letterSpacing: 1.5,
  },
  mutualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  mutualAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    marginRight: 14,
  },
  newBadge: {
    backgroundColor: '#FF4D4D',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});