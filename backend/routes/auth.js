import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /auth/signup
export const signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username)
      return res.status(400).json({ error: 'Email, password, and username are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle();
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    const { data: existingEmail } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{ id: userId, email, username, password_hash: hashedPassword, display_name: username, created_at: new Date().toISOString() }])
      .select().single();

    if (userError || !newUser) {
      console.error('Signup error:', userError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email, username: newUser.username, displayName: newUser.display_name, createdAt: newUser.created_at },
      token: generateToken(newUser)
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, bio, profile_picture_url, password_hash, created_at, is_admin')
      .eq('username', username).single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: 'Login successful',
      user: { ...userWithoutPassword, displayName: user.display_name, createdAt: user.created_at },
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/change-password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const { data: user, error } = await supabaseAdmin
      .from('users').select('password_hash').eq('id', userId).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('users').update({ password_hash: hashedPassword }).eq('id', userId);
    if (updateError) return res.status(500).json({ error: 'Failed to update password' });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /auth/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to delete account' });

    const { data: user, error } = await supabaseAdmin
      .from('users').select('password_hash').eq('id', userId).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Incorrect password' });

    // Delete user — cascade will handle follows, posts, messages etc.
    const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (deleteError) return res.status(500).json({ error: 'Failed to delete account' });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/logout
export const logout = (req, res) => res.status(200).json({ message: 'Logout successful' });

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', verifyToken, changePassword);
router.delete('/delete-account', verifyToken, deleteAccount);

export default router;
