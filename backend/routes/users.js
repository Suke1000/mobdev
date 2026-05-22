import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /users/search — filters out blocked users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const requesterId = req.user?.id;
    if (!query || query.length < 1) return res.status(400).json({ error: 'Search query required' });

    // Get blocked IDs (both directions)
    let blockedIds = [];
    if (requesterId) {
      const { data: blocks } = await supabaseAdmin
        .from('user_blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${requesterId},blocked_id.eq.${requesterId}`);
      (blocks || []).forEach(b => {
        blockedIds.push(b.blocker_id === requesterId ? b.blocked_id : b.blocker_id);
      });
    }

    let query2 = supabaseAdmin
      .from('users')
      .select('id, username, display_name, profile_picture_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    // Exclude blocked users and self
    if (blockedIds.length > 0) {
      query2 = query2.not('id', 'in', `(${blockedIds.join(',')})`);
    }
    if (requesterId) {
      query2 = query2.neq('id', requesterId);
    }

    const { data: users, error } = await query2;
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
      .from('users').select('id, username, display_name, bio, profile_picture_url, created_at, is_admin')
      .eq('id', id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const { count: followerCount } = await supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
    const { count: followingCount } = await supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id);
    const { data: stats } = await supabaseAdmin.from('user_stats').select('*').eq('user_id', id).maybeSingle();

    return res.status(200).json({
      user: {
        ...user,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        stats: stats ? { userId: stats.user_id, weight: stats.weight, squatPr: stats.squat_pr, benchPr: stats.bench_pr, deadliftPr: stats.deadlift_pr, updatedAt: stats.updated_at } : null,
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
    if (req.user?.id !== id) return res.status(403).json({ error: 'Cannot update other users' });

    if (display_name !== undefined || bio !== undefined) {
      const { error } = await supabaseAdmin.from('users')
        .update({ ...(display_name !== undefined && { display_name }), ...(bio !== undefined && { bio }) }).eq('id', id);
      if (error) return res.status(500).json({ error: 'Failed to update user info' });
    }

    if (weight !== undefined || squat_pr !== undefined || bench_pr !== undefined || deadlift_pr !== undefined) {
      const { data: existing } = await supabaseAdmin.from('user_stats').select('id').eq('user_id', id).maybeSingle();
      if (existing) {
        const { error } = await supabaseAdmin.from('user_stats').update({
          ...(weight !== undefined && { weight }), ...(squat_pr !== undefined && { squat_pr }),
          ...(bench_pr !== undefined && { bench_pr }), ...(deadlift_pr !== undefined && { deadlift_pr }),
          updated_at: new Date().toISOString(),
        }).eq('user_id', id);
        if (error) return res.status(500).json({ error: 'Failed to update stats' });
      } else {
        const { error } = await supabaseAdmin.from('user_stats').insert([{
          user_id: id, weight: weight ?? null, squat_pr: squat_pr ?? null, bench_pr: bench_pr ?? null, deadlift_pr: deadlift_pr ?? null,
        }]);
        if (error) return res.status(500).json({ error: 'Failed to create stats' });
      }
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
    const { data: posts, error } = await supabaseAdmin.from('posts')
      .select('id, user_id, content, image_url, created_at, users(username, display_name, profile_picture_url)')
      .eq('user_id', id).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return res.status(500).json({ error: 'Failed to fetch posts' });
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /users/:id/block — toggle block
export const blockUser = async (req, res) => {
  try {
    const blockerId = req.user?.id;
    const { id: blockedId } = req.params;
    if (blockerId === blockedId) return res.status(400).json({ error: 'Cannot block yourself' });

    const { data: existing } = await supabaseAdmin.from('user_blocks')
      .select('id').eq('blocker_id', blockerId).eq('blocked_id', blockedId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
      return res.status(200).json({ blocked: false, message: 'User unblocked' });
    } else {
      // Unfollow both ways when blocking
      await supabaseAdmin.from('follows').delete().eq('follower_id', blockerId).eq('following_id', blockedId);
      await supabaseAdmin.from('follows').delete().eq('follower_id', blockedId).eq('following_id', blockerId);
      await supabaseAdmin.from('user_blocks').insert([{ blocker_id: blockerId, blocked_id: blockedId }]);
      return res.status(200).json({ blocked: true, message: 'User blocked' });
    }
  } catch (error) {
    console.error('Block user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/blocks/list
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { data: blocks, error } = await supabaseAdmin
      .from('user_blocks')
      .select('blocked_id, users!user_blocks_blocked_id_fkey(id, username, display_name)')
      .eq('blocker_id', userId);
    if (error) return res.status(500).json({ error: 'Failed to fetch blocked users' });
    const blockedUsers = (blocks || []).map(b => ({
      id: b.users?.id, username: b.users?.username, displayName: b.users?.display_name,
    }));
    return res.status(200).json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/search', verifyToken, searchUsers);
router.get('/blocks/list', verifyToken, getBlockedUsers);
router.get('/:id', getUserProfile);
router.put('/:id', verifyToken, updateUserProfile);
router.get('/:id/posts', getUserPosts);
router.post('/:id/block', verifyToken, blockUser);

export default router;
