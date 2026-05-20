import React, { useState, useCallback, useEffect } from 'react';
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

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  return (
    <TouchableOpacity style={styles.conversationItem} onPress={() => onPress(conversation)}>
      <View style={styles.conversationAvatar}>
        <Text style={styles.conversationAvatarText}>👤</Text>
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{conversation.otherUser.username}</Text>
        <Text style={styles.lastMessageTime}>
          {new Date(conversation.lastMessageAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

interface ConversationWithUser extends Conversation {
  isExistingConversation?: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data);
      
      // Also fetch mutual followers who we haven't messaged yet
      const mutuals = await api.getMutualFollowers();
      // Filter out mutual followers who already have conversations
      const existingConversationUserIds = data.map((c: Conversation) => c.otherUser.id);
      const newMutuals = mutuals.filter((m: User) => !existingConversationUserIds.includes(m.id));
      setMutualFollowers(newMutuals);
    } catch (error) {
      console.error('Conversations fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchConversations();
      }
    }, [isAuthenticated, fetchConversations])
  );

  const handleConversationPress = (conversation: ConversationWithUser) => {
    // Navigate to chat screen using expo-router
    router.push({
      pathname: '/chat',
      params: {
        userId: conversation.otherUser.id,
        username: conversation.otherUser.username,
      },
    });
  };

  const handleStartConversation = (user: User) => {
    Alert.prompt(
      'Start Conversation',
      `Send a message to ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message: string | undefined) => {
            if (message && message.trim()) {
              try {
                await api.sendMessage(user.id, message.trim());
                Alert.alert('Success', 'Message sent!');
                fetchConversations(); // Refresh the list
                // Navigate to chat after sending
                router.push({
                  pathname: '/chat',
                  params: {
                    userId: user.id,
                    username: user.username,
                  },
                });
              } catch (error) {
                Alert.alert('Error', 'Failed to send message');
              }
            }
          },
        },
      ]
    );
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
        renderItem={({ item }) => (
          <ConversationItem conversation={item} onPress={handleConversationPress} />
        )}
        onRefresh={fetchConversations}
        refreshing={refreshing}
        ListEmptyComponent={
          filteredMutualFollowers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Follow users who follow you back to start messaging</Text>
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
                  onPress={() => handleStartConversation(user)}
                >
                  <View style={styles.mutualFollowerAvatar}>
                    <Text style={styles.mutualFollowerAvatarText}>👤</Text>
                  </View>
                  <Text style={styles.mutualFollowerName}>{user.username}</Text>
                  <Text style={styles.mutualFollowerArrow}>›</Text>
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
    gap: 12,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationAvatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  lastMessageTime: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  arrow: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  mutualFollowersSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  mutualFollowerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  mutualFollowerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutualFollowerAvatarText: {
    fontSize: 20,
  },
  mutualFollowerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  mutualFollowerArrow: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
});
