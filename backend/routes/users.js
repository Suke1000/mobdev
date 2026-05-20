import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /users/search - Search users by username
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, profile_picture_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (error) {
      return res.status(500).json({ error: 'Failed to search users' });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/:id - Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('getUserProfile - fetching for id:', id);

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        bio,
        profile_picture_url,
        created_at,
        user_specialization(specialization_type)
      `)
      .eq('id', id)
      .single();

    console.log('getUserProfile - user data:', user);
    console.log('getUserProfile - error:', error);
    console.log('getUserProfile - user_specialization:', user?.user_specialization);

    if (error || !user) {
      console.log('getUserProfile - user not found, error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', id)
      .single();

    // Flatten specialization from nested array to simple string
    const specialization = user.user_specialization?.[0]?.specialization_type || null;
    console.log('getUserProfile - extracted specialization:', specialization);
    const { user_specialization, ...rest } = user;
    
    const response = {
      user: {
        ...rest,
        specialization,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        stats: stats || null
      }
    };
    console.log('getUserProfile - sending response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /users/:id - Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, bio, weight, squat_pr, bench_pr, deadlift_pr, specialization } = req.body;

    // Verify token matches user
    if (req.user?.id !== id) {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    // Update user info
    if (display_name || bio) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          ...(display_name && { display_name }),
          ...(bio && { bio })
        })
        .eq('id', id);

      if (userError) {
        return res.status(500).json({ error: 'Failed to update user' });
      }
    }

    // Update specialization if provided
    if (specialization) {
      const VALID_SPECIALIZATIONS = ['SBL', 'Conventional', 'Powerlifting'];
      
      if (!VALID_SPECIALIZATIONS.includes(specialization)) {
        return res.status(400).json({ error: 'Invalid specialization type' });
      }

      // Check if specialization record exists
      const { data: existingSpecs, error: queryError } = await supabase
        .from('user_specialization')
        .select('id')
        .eq('user_id', id);

      if (queryError) {
        console.error('Specialization query error:', queryError);
        return res.status(500).json({ error: 'Failed to check specialization' });
      }

      const existingSpec = existingSpecs && existingSpecs.length > 0;

      if (existingSpec) {
        // Update existing specialization
        const { error: specError } = await supabase
          .from('user_specialization')
          .update({ specialization_type: specialization })
          .eq('user_id', id);

        if (specError) {
          console.error('Specialization update error:', specError);
          return res.status(500).json({ error: 'Failed to update specialization' });
        }
      } else {
        // Create new specialization record
        const { error: specError } = await supabase
          .from('user_specialization')
          .insert([{ user_id: id, specialization_type: specialization }]);

        if (specError) {
          console.error('Specialization insert error:', specError);
          return res.status(500).json({ error: 'Failed to set specialization' });
        }
      }
    }

    // Update or insert stats
    if (weight || squat_pr || bench_pr || deadlift_pr) {
      const { data: existingStats, error: statsQueryError } = await supabase
        .from('user_stats')
        .select('id')
        .eq('user_id', id);

      if (statsQueryError) {
        console.error('Stats query error:', statsQueryError);
        return res.status(500).json({ error: 'Failed to check stats' });
      }

      const hasExistingStats = existingStats && existingStats.length > 0;

      if (hasExistingStats) {
        const { error: statsError } = await supabase
          .from('user_stats')
          .update({
            ...(weight && { weight }),
            ...(squat_pr && { squat_pr }),
            ...(bench_pr && { bench_pr }),
            ...(deadlift_pr && { deadlift_pr }),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', id);

        if (statsError) {
          return res.status(500).json({ error: 'Failed to update stats' });
        }
      } else {
        const { error: statsError } = await supabase
          .from('user_stats')
          .insert([{
            user_id: id,
            weight: weight || null,
            squat_pr: squat_pr || null,
            bench_pr: bench_pr || null,
            deadlift_pr: deadlift_pr || null
          }]);

        if (statsError) {
          return res.status(500).json({ error: 'Failed to create stats' });
        }
      }
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/:id/posts - Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        image_url,
        created_at,
        users(username, display_name, profile_picture_url)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

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
