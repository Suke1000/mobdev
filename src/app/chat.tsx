import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Message } from '../types';

const MessageItem: React.FC<{ message: Message; currentUserId?: string }> = ({ message, currentUserId }) => {
  const isOwn = currentUserId ? message.senderId === currentUserId : false;
  const senderName = message.sender?.username || message.sender?.displayName || 'User';

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>💪</Text>
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.senderName}>{senderName}</Text>}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.content}</Text>
      </View>
      {isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>💪</Text>
        </View>
      )}
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

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !resolvedUserId) return;
    try {
      setSending(true);
      await api.sendMessage(resolvedUserId, newMessage.trim());
      setNewMessage('');
      await fetchMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageItem message={item} currentUserId={user?.id} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Say hello to {username}!</Text>
          </View>
        }
      />

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#444"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          editable={true}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (sending || !newMessage.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !newMessage.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.sendBtnText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
  messagesList: { padding: 16, paddingBottom: 8, gap: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  avatarEmoji: { fontSize: 14 },
  bubble: { maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleOwn: { backgroundColor: '#FF4D4D', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1A1A1A', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2A2A2A' },
  senderName: { fontSize: 11, fontWeight: '700', color: '#FF4D4D', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#DDDDDD', lineHeight: 20 },
  messageTextOwn: { color: '#FFFFFF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#555' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#0F0F0F',
    borderTopWidth: 1, borderTopColor: '#1A1A1A',
  },
  input: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#FFFFFF',
    maxHeight: 100, borderWidth: 1, borderColor: '#2A2A2A',
  },
  sendBtn: {
    backgroundColor: '#FF4D4D', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
