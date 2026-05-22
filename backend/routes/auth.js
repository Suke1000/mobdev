import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper: Generate JWT token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment');
  }
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

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email,
        username,
        password_hash: hashedPassword,
        display_name: username,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Signup user insert error:', userError);
      return res.status(500).json({ error: 'Failed to create user', details: userError?.message });
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.display_name,
        createdAt: newUser.created_at
      },
      token
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

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, bio, profile_picture_url, password_hash, created_at, is_admin')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        displayName: user.display_name,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/logout
export const logout = (req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router;
