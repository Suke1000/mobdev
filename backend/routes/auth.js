import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const SPECIALIZATION_TYPES = ['SBL', 'Conventional', 'Powerlifting'];
const COMMUNITY_IDS = {
  'SBL': 'sbl-community',
  'Conventional': 'conventional-community',
  'Powerlifting': 'powerlifting-community'
};

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
    const { email, password, username, specialization } = req.body;

    // Validate input
    if (!email || !password || !username || !specialization) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!SPECIALIZATION_TYPES.includes(specialization)) {
      return res.status(400).json({ error: 'Invalid specialization type' });
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single();


    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user in database
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([

        {
          id: userId,
          email,
          username,
          password_hash: hashedPassword,
          display_name: username,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Signup user insert error:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code,
      });
      return res.status(500).json({ error: 'Failed to create user', details: userError.message });
    }

    if (!newUser) {
      console.error('Signup user insert returned no data');
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Add user specialization
    const { error: specError } = await supabaseAdmin
      .from('user_specialization')
      .insert([{ user_id: userId, specialization_type: specialization }]);

    if (specError) {
      console.error('Signup specialization insert error:', {
        message: specError.message,
        details: specError.details,
        hint: specError.hint,
        code: specError.code,
      });
    }

    // Auto-join community
    const communityId = COMMUNITY_IDS[specialization];
    const { error: communityError } = await supabaseAdmin
      .from('user_communities')
      .insert([
        {
          user_id: userId,
          community_id: communityId,
          joined_at: new Date().toISOString()
        }
      ]);

    if (communityError) {
      console.error('Signup community join error:', {
        message: communityError.message,
        details: communityError.details,
        hint: communityError.hint,
        code: communityError.code,
      });
    }

    const token = generateToken(newUser);

    // Return user object with specialization included
    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.display_name,
        specialization: specialization,
        createdAt: newUser.created_at
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      // Supabase errors sometimes surface here
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
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

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get specialization
    const { data: spec } = await supabase
      .from('user_specialization')
      .select('specialization_type')
      .eq('user_id', user.id)
      .single();

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        specialization: spec?.specialization_type || null,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /auth/logout (optional - mainly client-side)
export const logout = (req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router;
