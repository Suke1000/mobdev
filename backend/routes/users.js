import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /users/search
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 1) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, profile_picture_url')
      .ilike('username', `%${query}%`)
      .limit(20);
    if (error) return res.status(500).json({ error: 'Failed to search users' });
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/:id
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, bio, profile_picture_url, created_at, is_admin')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { count: followerCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);

    const { count: followingCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    const transformedStats = stats ? {
      userId: stats.user_id,
      weight: stats.weight,
      squatPr: stats.squat_pr,
      benchPr: stats.bench_pr,
      deadliftPr: stats.deadlift_pr,
      updatedAt: stats.updated_at,
    } : null;

    return res.status(200).json({
      user: {
        ...user,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        stats: transformedStats,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /users/:id
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, bio, weight, squat_pr, bench_pr, deadlift_pr } = req.body;

    console.log('updateUserProfile - req.user:', req.user, 'id:', id);

    if (req.user?.id !== id) {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    // Update user info
    if (display_name !== undefined || bio !== undefined) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          ...(display_name !== undefined && { display_name }),
          ...(bio !== undefined && { bio }),
        })
        .eq('id', id);
      if (error) {
        console.error('User update error:', error);
        return res.status(500).json({ error: 'Failed to update user info' });
      }
    }

    // Upsert stats
    if (weight !== undefined || squat_pr !== undefined || bench_pr !== undefined || deadlift_pr !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from('user_stats')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from('user_stats')
          .update({
            ...(weight !== undefined && { weight }),
            ...(squat_pr !== undefined && { squat_pr }),
            ...(bench_pr !== undefined && { bench_pr }),
            ...(deadlift_pr !== undefined && { deadlift_pr }),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', id);
        if (error) {
          console.error('Stats update error:', error);
          return res.status(500).json({ error: 'Failed to update stats' });
        }
      } else {
        const { error } = await supabaseAdmin
          .from('user_stats')
          .insert([{
            user_id: id,
            weight: weight ?? null,
            squat_pr: squat_pr ?? null,
            bench_pr: bench_pr ?? null,
            deadlift_pr: deadlift_pr ?? null,
          }]);
        if (error) {
          console.error('Stats insert error:', error);
          return res.status(500).json({ error: 'Failed to create stats' });
        }
      }
      console.log('✅ Stats saved for user:', id);
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/:id/posts
export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content, image_url, created_at, users(username, display_name, profile_picture_url)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return res.status(500).json({ error: 'Failed to fetch posts' });
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/:id', verifyToken, updateUserProfile);
router.get('/:id/posts', getUserPosts);

export default router;
