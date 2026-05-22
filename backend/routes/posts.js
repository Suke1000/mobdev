import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// Get all blocked user IDs for a given user (both directions)
const getBlockedUserIds = async (userId) => {
  const { data: blocks } = await supabaseAdmin
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const blockedIds = new Set();
  (blocks || []).forEach(b => {
    if (b.blocker_id === userId) blockedIds.add(b.blocked_id);
    else blockedIds.add(b.blocker_id);
  });
  return [...blockedIds];
};

const transformPost = (post) => ({
  id: post.id,
  userId: post.user_id,
  content: post.content,
  imageUrl: post.image_url,
  communityId: post.community_id,
  createdAt: post.created_at,
  updatedAt: post.created_at,
  likeCount: 0,
  commentCount: 0,
  isLiked: false,
  user: post.users ? {
    id: post.users.id,
    username: post.users.username,
    displayName: post.users.display_name,
    profilePictureUrl: post.users.profile_picture_url,
  } : null,
});

const enrichPosts = async (posts, userId) => {
  if (!posts || posts.length === 0) return [];
  const postIds = posts.map(p => p.id);

  const { data: likes } = await supabaseAdmin.from('post_likes').select('post_id').in('post_id', postIds);
  const { data: comments } = await supabaseAdmin.from('post_comments').select('post_id').in('post_id', postIds);
  const { data: userLikes } = userId
    ? await supabaseAdmin.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', userId)
    : { data: [] };

  const likedPostIds = new Set((userLikes || []).map(l => l.post_id));
  const likeCounts = {};
  const commentCounts = {};
  (likes || []).forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
  (comments || []).forEach(c => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

  return posts.map(p => ({
    ...transformPost(p),
    likeCount: likeCounts[p.id] || 0,
    commentCount: commentCounts[p.id] || 0,
    isLiked: likedPostIds.has(p.id),
  }));
};

// POST /posts
export const createPost = async (req, res) => {
  try {
    const { content, communityId } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    let imageUrl = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `posts/${fileName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('post-images').upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      if (uploadError) return res.status(500).json({ error: 'Failed to upload image' });
      const { data: publicUrlData } = supabaseAdmin.storage.from('post-images').getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert([{ user_id: userId, content: content.trim(), image_url: imageUrl, community_id: communityId || null, created_at: new Date().toISOString() }])
      .select().single();

    if (error) return res.status(500).json({ error: 'Failed to create post' });
    return res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /posts/feed — filters out blocked users in both directions
export const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // Get all blocked user IDs (users I blocked + users who blocked me)
    const blockedIds = await getBlockedUserIds(userId);

    let query = supabaseAdmin
      .from('posts')
      .select(`id, user_id, content, image_url, created_at, community_id, users(id, username, display_name, profile_picture_url)`)
      .order('created_at', { ascending: false });

    // Exclude posts from blocked/blocking users
    if (blockedIds.length > 0) {
      query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
    }

    const { data: posts, error } = await query.range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) return res.status(500).json({ error: 'Failed to fetch feed' });

    const enriched = await enrichPosts(posts, userId);
    return res.status(200).json({ posts: enriched });
  } catch (error) {
    console.error('Feed error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /posts
export const getAllPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0, communityId } = req.query;
    let query = supabaseAdmin
      .from('posts')
      .select(`id, user_id, content, image_url, created_at, community_id, users(id, username, display_name, profile_picture_url)`)
      .order('created_at', { ascending: false });
    if (communityId) query = query.eq('community_id', communityId);
    const { data: posts, error } = await query.range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) return res.status(500).json({ error: 'Failed to fetch posts' });
    const enriched = await enrichPosts(posts, null);
    return res.status(200).json({ posts: enriched });
  } catch (error) {
    console.error('Get all posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /posts/:id
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { data: post } = await supabaseAdmin.from('posts').select('user_id').eq('id', id).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== userId) return res.status(403).json({ error: 'Cannot delete other users posts' });
    const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Failed to delete post' });
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /posts/:id/like
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { data: existing } = await supabaseAdmin
      .from('post_likes').select('id').eq('post_id', id).eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('post_likes').delete().eq('post_id', id).eq('user_id', userId);
      return res.status(200).json({ liked: false });
    } else {
      await supabaseAdmin.from('post_likes').insert([{ post_id: id, user_id: userId }]);
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /posts/:id/comments
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: comments, error } = await supabaseAdmin
      .from('post_comments')
      .select(`id, content, created_at, user_id, users(id, username, display_name)`)
      .eq('post_id', id).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: 'Failed to fetch comments' });
    return res.status(200).json({
      comments: comments.map(c => ({
        id: c.id, content: c.content, createdAt: c.created_at, userId: c.user_id,
        user: { id: c.users?.id, username: c.users?.username, displayName: c.users?.display_name },
      }))
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /posts/:id/comments
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    const { data: comment, error } = await supabaseAdmin
      .from('post_comments')
      .insert([{ post_id: id, user_id: userId, content: content.trim() }])
      .select(`id, content, created_at, user_id, users(id, username, display_name)`).single();
    if (error) return res.status(500).json({ error: 'Failed to add comment' });
    return res.status(201).json({
      comment: {
        id: comment.id, content: comment.content, createdAt: comment.created_at, userId: comment.user_id,
        user: { id: comment.users?.id, username: comment.users?.username, displayName: comment.users?.display_name },
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/', verifyToken, upload.single('image'), createPost);
router.get('/feed', verifyToken, getFeed);
router.get('/', getAllPosts);
router.delete('/:id', verifyToken, deletePost);
router.post('/:id/like', verifyToken, likePost);
router.get('/:id/comments', getComments);
router.post('/:id/comments', verifyToken, addComment);

export default router;
