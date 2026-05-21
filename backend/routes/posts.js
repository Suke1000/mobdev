import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST /posts - Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, communityId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      imageUrl = `/uploads/posts/${req.file.filename}`;
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert([{
        user_id: userId,
        content: content.trim(),
        image_url: imageUrl,
        community_id: communityId || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Post insert error:', error);
      return res.status(500).json({ error: 'Failed to create post', details: error.message });
    }

    return res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /posts/feed - Get personalized feed (posts from followed users)
export const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get IDs of users that current user follows
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = following?.map(f => f.following_id) || [];

    // Get posts from followed users + own posts
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        image_url,
        created_at,
        community_id,
        users(id, username, display_name, profile_picture_url)
      `)
      .in('user_id', [...followingIds, userId])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Feed fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch feed' });
    }

    // Transform the response to match frontend expectations
    const transformedPosts = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      communityId: post.community_id,
      createdAt: post.created_at,
      updatedAt: post.created_at,
      user: post.users ? {
        id: post.users.id,
        username: post.users.username,
        displayName: post.users.display_name,
        profilePictureUrl: post.users.profile_picture_url,
      } : null,
    }));

    return res.status(200).json({ posts: transformedPosts });
  } catch (error) {
    console.error('Feed error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /posts/:id - Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get post to verify ownership
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Cannot delete other users\' posts' });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Post delete error:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /posts - Get all posts (public feed)
export const getAllPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0, communityId } = req.query;

    let query = supabaseAdmin
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        image_url,
        created_at,
        community_id,
        users(id, username, display_name, profile_picture_url)
      `)
      .order('created_at', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data: posts, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Get all posts error:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    // Transform the response to match frontend expectations
    const transformedPosts = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      imageUrl: post.image_url,
      communityId: post.community_id,
      createdAt: post.created_at,
      updatedAt: post.created_at,
      user: post.users ? {
        id: post.users.id,
        username: post.users.username,
        displayName: post.users.display_name,
        profilePictureUrl: post.users.profile_picture_url,
      } : null,
    }));

    return res.status(200).json({ posts: transformedPosts });
  } catch (error) {
    console.error('Get all posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/', verifyToken, upload.single('image'), createPost);
router.get('/feed', verifyToken, getFeed);
router.get('/', getAllPosts);
router.delete('/:id', verifyToken, deletePost);

export default router;