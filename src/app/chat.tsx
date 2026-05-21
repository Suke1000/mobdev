import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Message } from '../types';

const MessageItem: React.FC<{ 
  message: Message; 
  currentUserId?: string; 
}> = ({ message, currentUserId }) => {
  const isOwnMessage = currentUserId ? message.senderId === currentUserId : false;
  
  // Get sender's username from message.sender object with fallbacks
  const senderName = message.sender?.username || message.sender?.displayName || 'User';

  return (
    <View style={[
      styles.messageItem,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={styles.messageHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={[
          styles.senderName,
          isOwnMessage ? styles.ownSenderName : styles.otherSenderName
        ]}>
          {senderName}
        </Text>
      </View>
      <Text style={[
        styles.messageText,
        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {message.content}
      </Text>
    </View>
  );
};

export default function ChatScreen() {
  const route = useRoute<any>();
  const { userId, username } = route.params || {};

  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Note: Header title is set via _layout.tsx route options

  useEffect(() => {
    console.log('Chat params debug:', { userId, username });
  }, [userId, username]);

  const fetchMessages = useCallback(async () => {
    if (!resolvedUserId) return;
    try {
      setLoading(true);
      const data = await api.getMessages(resolvedUserId as string);
      setMessages(data);
    } catch (error) {
      console.error('Messages fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, resolvedUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      if (!resolvedUserId) return;
      setSending(true);
      await api.sendMessage(resolvedUserId, newMessage.trim());
      setNewMessage('');
      await fetchMessages();
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={80}
      enabled={true}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem 
            message={item} 
            currentUserId={user?.id}
          />
        )}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputContainerWrapper} pointerEvents="box-none">
        <View style={styles.inputContainer} pointerEvents="box-none">
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.light.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          editable={true}
          pointerEvents="auto"
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>
            {sending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageItem: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: Colors.light.text,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 12,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  ownSenderName: {
    color: 'rgba(255,255,255,0.9)',
  },
  otherSenderName: {
    color: Colors.light.text,
  },
  inputContainerWrapper: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});