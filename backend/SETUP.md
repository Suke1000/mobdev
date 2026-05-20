# PRboard Backend Setup Guide

## Prerequisites

1. **Node.js** (v18+)
2. **Supabase Account** (https://supabase.com)
3. **npm** or **yarn**

## Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Save your project URL and API keys (anon key and service role key)

### 2. Set Up Database

1. Go to SQL Editor in your Supabase project
2. Create a new query
3. Copy the entire contents of `database.sql`
4. Paste and execute in the SQL editor
5. Wait for all tables and policies to be created

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3000
   ```

### 5. Create Upload Directories

```bash
mkdir -p uploads/posts
mkdir -p uploads/profiles
touch uploads/.gitkeep
touch uploads/posts/.gitkeep
```

### 6. Start Development Server

```bash
npm run dev
```

The server should be running on `http://localhost:3000`

Test the health check:
```bash
curl http://localhost:3000/health
```

## API Endpoints Overview

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout

### Users
- `GET /users/search?query=username` - Search users
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update profile
- `GET /users/:id/posts` - Get user's posts

### Posts
- `POST /posts` - Create post (requires auth + file upload)
- `GET /posts/feed` - Get personalized feed (requires auth)
- `GET /posts` - Get public feed
- `DELETE /posts/:id` - Delete post (requires auth)

### Follow System
- `POST /follow/:userId` - Follow user
- `DELETE /follow/:userId` - Unfollow user
- `GET /follow/:userId/followers` - Get followers
- `GET /follow/:userId/following` - Get following list

### Messaging
- `POST /messages` - Send message
- `GET /messages/conversations` - Get user's conversations
- `GET /messages/:conversationId` - Get messages in conversation
- `PUT /messages/:messageId/read` - Mark message as read

### Rankings
- `GET /rankings/:communityId` - Get rankings for community
- `GET /rankings` - Get all rankings
- `POST /rankings/recalculate` - Recalculate rankings (admin)

### Admin
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user details
- `DELETE /admin/posts/:postId` - Delete post
- `POST /admin/users/:userId/suspend` - Suspend user
- `POST /admin/users/:userId/ban` - Ban user
- `POST /admin/users/:userId/unban` - Unban user
- `GET /admin/stats` - Get platform stats

## Important Notes

- All file uploads go to `backend/uploads/`
- Images served at: `http://localhost:3000/uploads/posts/filename.jpg`
- JWT tokens expire in 7 days
- Always protect sensitive routes with `verifyToken` middleware
- Admin routes require both auth AND `isAdmin` middleware

## Next Steps

1. Frontend integration (React Native Expo)
2. Environment-specific config (production URLs)
3. Cron job for ranking recalculation
4. Production deployment (Railway, Render, etc.)
