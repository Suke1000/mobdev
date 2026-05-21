import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /messages - Send a message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient and content required' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Create message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert([{
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (msgError) {
      console.error('Message insert error:', msgError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update or create conversation
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${senderId})`)
      .single();

    if (!conversation) {
      await supabaseAdmin
        .from('conversations')
        .insert([{
          user1_id: senderId,
          user2_id: recipientId,
          last_message_at: new Date().toISOString()
        }]);
    } else {
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    }

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /messages/conversations - Get user's conversations (only with mutual followers)
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // First, find users who have mutual follows (both follow each other)
    const { data: mutualFollows } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = mutualFollows?.map(f => f.following_id) || [];

    // Find users who follow the current user
    const { data: followers } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    const followerIds = followers?.map(f => f.follower_id) || [];

    // Get mutual followers (users who follow each other)
    const mutualFollowerIds = followingIds.filter(id => followerIds.includes(id));

    if (mutualFollowerIds.length === 0) {
      return res.status(200).json({ conversations: [] });
    }

    // Get conversations with mutual followers
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_at,
        users!conversations_user1_id_fkey(id, username, display_name, profile_picture_url),
        users_2:users!conversations_user2_id_fkey(id, username, display_name, profile_picture_url)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Filter to only include conversations with mutual followers
    const filteredConversations = conversations?.filter(conv => {
      const otherUserId = conv.user1_id === userId ? conv.users_2?.id : conv.users?.id;
      return mutualFollowerIds.includes(otherUserId);
    }) || [];

    // Format response
    const formatted = filteredConversations.map(conv => ({
      id: conv.id,
      otherUser: conv.user1_id === userId ? conv.users_2 : conv.users,
      lastMessageAt: conv.last_message_at
    }));

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /messages/mutual-followers - Get list of mutual followers for messaging
export const getMutualFollowers = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find users who the current user follows
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];

    // Find users who follow the current user
    const { data: followers } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    const followerIds = followers?.map(f => f.follower_id) || [];

    // Get mutual followers
    const mutualFollowerIds = followingIds.filter(id => followerIds.includes(id));

    if (mutualFollowerIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get user details for mutual followers
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, profile_picture_url')
      .in('id', mutualFollowerIds);

    if (error) {
      console.error('Get mutual followers error:', error);
      return res.status(500).json({ error: 'Failed to fetch mutual followers' });
    }

    return res.status(200).json(users || []);
  } catch (error) {
    console.error('Get mutual followers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /messages/:conversationId - Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        created_at,
        read_at,
        users!sender_id(id, username, display_name, profile_picture_url)
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Transform the response to match frontend expectations
    const transformedMessages = messages?.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      content: msg.content,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      sender: msg.users ? {
        id: msg.users.id,
        username: msg.users.username,
        displayName: msg.users.display_name,
        profilePictureUrl: msg.users.profile_picture_url
      } : null
    })) || [];

    console.log('Transformed messages:', transformedMessages);
    return res.status(200).json({ messages: transformedMessages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /messages/:messageId/read - Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }

    return res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/', verifyToken, sendMessage);
router.get('/conversations', verifyToken, getConversations);
router.get('/mutual-followers', verifyToken, getMutualFollowers);
router.get('/:conversationId', verifyToken, getMessages);
router.put('/:messageId/read', verifyToken, markAsRead);

export default router;