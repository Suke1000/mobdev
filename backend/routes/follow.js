import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /follow/:userId - Follow a user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (followerId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const { data: existing } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', userId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    const { error } = await supabaseAdmin
      .from('follows')
      .insert([{
        follower_id: followerId,
        following_id: userId,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Follow insert error:', error);
      return res.status(500).json({ error: 'Failed to follow user', details: error.message });
    }

    // Note: Follower/following counts are now calculated dynamically
    // instead of stored in the users table

    return res.status(201).json({ message: 'Following user successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /follow/:userId - Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', userId);

    if (error) {
      console.error('Unfollow delete error:', error);
      return res.status(500).json({ error: 'Failed to unfollow user', details: error.message });
    }

    // Note: Follower/following counts are now calculated dynamically
    // instead of stored in the users table

    return res.status(200).json({ message: 'Unfollowed user successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /follow/:userId/followers - Get user's followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: followers, error } = await supabaseAdmin
      .from('follows')
      .select('users!follower_id(id, username, display_name, profile_picture_url)')
      .eq('following_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch followers' });
    }

    return res.status(200).json({
      followers: followers?.map(f => f.users) || []
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /follow/:userId/following - Get users that user follows
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: following, error } = await supabaseAdmin
      .from('follows')
      .select('users!following_id(id, username, display_name, profile_picture_url)')
      .eq('follower_id', userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch following' });
    }

    return res.status(200).json({
      following: following?.map(f => f.users) || []
    });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/:userId', verifyToken, followUser);
router.delete('/:userId', verifyToken, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;