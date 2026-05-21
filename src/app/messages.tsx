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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search conversations..."
        placeholderTextColor={Colors.light.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
          >
            <View style={styles.conversationAvatar}>
              <Text style={styles.conversationAvatarText}>👤</Text>
            </View>
            <View style={styles.conversationInfo}>
              <Text style={styles.conversationName}>{item.otherUser.username}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          filteredMutualFollowers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Follow users who follow you back to start messaging
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          filteredMutualFollowers.length > 0 ? (
            <View style={styles.mutualFollowersSection}>
              <Text style={styles.sectionTitle}>Mutual Followers - Tap to Message</Text>
              {filteredMutualFollowers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.mutualFollowerItem}
                  onPress={() => {
                    Alert.alert('Start Conversation', `Send a message to ${user.username}?`);
                    router.push({
                      pathname: '/chat',
                      params: { userId: user.id, username: user.username },
                    });
                  }}
                >
                  <Text style={styles.mutualFollowerName}>{user.username}</Text>
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
    backgroundColor: Colors.light.background,
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationAvatarText: { fontSize: 24 },
  conversationInfo: { flex: 1 },
  conversationName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  arrow: { fontSize: 20, color: Colors.light.textSecondary },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Colors.light.textSecondary },
  mutualFollowersSection: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  mutualFollowerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  mutualFollowerName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
});
