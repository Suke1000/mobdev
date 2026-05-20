import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /admin/users - List all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, email, created_at, is_admin')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/users/:id - Get specific user details (admin only)
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /admin/posts/:postId - Delete a post (admin only)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/users/:userId/suspend - Suspend a user account
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: true,
        suspension_reason: reason || null,
        suspended_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to suspend user' });
    }

    return res.status(200).json({ message: 'User suspended successfully' });
  } catch (error) {
    console.error('Suspend user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/users/:userId/ban - Permanently ban a user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('users')
      .update({
        is_banned: true,
        ban_reason: reason || null,
        banned_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to ban user' });
    }

    return res.status(200).json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /admin/users/:userId/unban - Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to unban user' });
    }

    return res.status(200).json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /admin/stats - Get platform statistics (admin only)
export const getStats = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Active communities
    const { count: totalCommunities } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      stats: {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalCommunities: totalCommunities || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/users', verifyToken, isAdmin, getAllUsers);
router.get('/users/:id', verifyToken, isAdmin, getUserDetails);
router.delete('/posts/:postId', verifyToken, isAdmin, deletePost);
router.post('/users/:userId/suspend', verifyToken, isAdmin, suspendUser);
router.post('/users/:userId/ban', verifyToken, isAdmin, banUser);
router.post('/users/:userId/unban', verifyToken, isAdmin, unbanUser);
router.get('/stats', verifyToken, isAdmin, getStats);

export default router;
