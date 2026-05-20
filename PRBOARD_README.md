# PRboard - Gym Social Network App

A React Native Expo mobile application that combines Reddit-style forums with a gym-focused community. Users can track their lifting stats, compete on leaderboards, and connect with others who share their specialization in powerlifting.

## 🎯 Features

### Core Features
- **User Authentication**: Secure signup/login with email and password
- **Specialization System**: Users choose between SBL, Conventional, or Powerlifting on signup
- **Auto-Community Joining**: Automatically join dedicated community for your specialization
- **Social Feed**: Infinite scroll feed with posts from followed users
- **User Search**: Discover and follow other gym enthusiasts
- **Post Creation**: Share text and images with your community
- **Real-Time Messaging**: Send direct messages to other users
- **Leaderboards**: Compete based on lifting stats by specialization
- **User Profiles**: Display lifting stats (weight, PRs for squat/bench/deadlift)

### Admin Features
- **User Management**: View all users with status badges (Active/Suspended/Banned)
- **Moderation**: Ban or suspend users with reasons
- **Dashboard**: View system statistics (total users, posts, suspensions, bans)
- **User Details**: Access detailed user information

### User Experience
- **Dark Mode**: System-aware dark/light theme support
- **Error Boundaries**: Graceful error handling with recovery options
- **Settings**: Customize appearance, notifications, and privacy
- **Responsive Design**: Optimized for iOS and Android

## 📱 Tech Stack

### Frontend
- **React Native** 0.81.5 with Expo 54
- **Expo Router** 6.0 for file-based routing
- **TypeScript** for type safety
- **React Navigation** for tab-based navigation
- **Axios** for API communication
- **Expo Secure Store** for token persistence

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL + Auth + Realtime)
- **JWT** for authentication
- **Multer** for file uploads
- **CORS** enabled for frontend/backend communication

### Database
- **PostgreSQL** via Supabase
- **Row Level Security** (RLS) policies
- **10 Tables**: users, user_specialization, communities, user_communities, posts, follows, user_stats, rankings, messages, conversations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (for database and auth)

### Installation

1. **Clone and setup frontend**
   ```bash
   cd PRboard
   npm install
   ```

2. **Setup backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Supabase**
   - Create a Supabase project
   - Run database schema from `backend/database.sql`
   - Copy credentials to `backend/.env`:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     JWT_SECRET=your_jwt_secret
     PORT=3000
     ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev  # Starts on http://localhost:3000

   # Terminal 2: Frontend
   cd PRboard
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

## 📖 Project Structure

```
PRboard/
├── src/
│   ├── app/                    # Expo Router routes
│   │   ├── _layout.tsx        # Root layout with auth/error handling
│   │   ├── index.tsx          # Feed screen
│   │   ├── explore.tsx        # Search screen
│   │   ├── messages.tsx       # Conversations screen
│   │   ├── rankings.tsx       # Leaderboard screen
│   │   ├── profile.tsx        # User profile
│   │   ├── admin.tsx          # Admin panel
│   │   ├── settings.tsx       # Settings
│   │   └── new-post.tsx       # Create post
│   ├── screens/
│   │   ├── auth/              # Authentication screens
│   │   ├── social/            # Social features
│   │   ├── admin/             # Admin screens
│   │   └── settings/          # Settings screens
│   ├── services/
│   │   └── api.ts            # Axios API client
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state management
│   │   └── ThemeContext.tsx   # Theme state management
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   ├── PostCard.tsx       # Post display component
│   │   └── app-tabs.tsx       # Tab navigation
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── constants/
│       └── theme.ts           # Colors and spacing
│
backend/
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── users.js              # User profile endpoints
│   ├── posts.js              # Post management
│   ├── follow.js             # Follow/unfollow
│   ├── messages.js           # Direct messaging
│   ├── rankings.js           # Leaderboard
│   └── admin.js              # Admin operations
├── middleware/
│   └── auth.js               # JWT verification
├── config/
│   └── supabase.js          # Supabase client
├── server.js                 # Express app entry
├── database.sql              # Database schema
└── SETUP.md                  # Backend setup guide
```

## 🔐 Authentication Flow

1. User signs up with email, username, password, and specialization
2. Password hashed with bcryptjs (10 rounds)
3. User record created in database
4. Specialization recorded + auto-join community
5. JWT token issued (7-day expiry)
6. Token stored in Expo Secure Store
7. Token attached to all API requests via axios interceptor
8. 401 responses trigger token cleanup

## 🏋️ Ranking Algorithm

Weight-normalized PR score:
```
score = (squat_pr + bench_pr + deadlift_pr) / weight * 100
```

Calculated per community. Users can update their stats in profile settings.

## 📊 Database Schema

### Key Tables

**users**: ID, email, username, password_hash, display_name, bio, profile_picture_url, is_admin, is_suspended, is_banned, suspension_reason, ban_reason, created_at

**user_specialization**: user_id, specialization_type (SBL, Conventional, Powerlifting)

**communities**: id, name, specialization_type, description

**posts**: id, user_id, community_id, content, image_url, created_at

**follows**: follower_id, following_id (unique constraint)

**user_stats**: user_id, weight, squat_pr, bench_pr, deadlift_pr

**rankings**: community_id, user_id, rank, score (unique per community)

**messages**: sender_id, recipient_id, content, read_at

**conversations**: user1_id, user2_id, last_message_at

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users/search?query=` - Search users
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update profile
- `GET /users/:id/posts` - Get user's posts

### Posts
- `POST /posts` - Create post (multipart/form-data)
- `GET /posts/feed` - Get followed users' posts
- `GET /posts` - Get public posts
- `DELETE /posts/:id` - Delete post

### Social
- `POST /follow/:id` - Follow user
- `DELETE /follow/:id` - Unfollow user
- `GET /follow/:id/followers` - Get followers
- `GET /follow/:id/following` - Get following

### Messages
- `POST /messages` - Send message
- `GET /messages/conversations` - Get conversations
- `GET /messages/:conversationId` - Get messages

### Rankings
- `GET /rankings/:communityId` - Get leaderboard for community
- `GET /rankings` - Get all community leaderboards

### Admin
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user details
- `POST /admin/users/:id/ban` - Ban user
- `POST /admin/users/:id/unban` - Unban user
- `POST /admin/users/:id/suspend` - Suspend user
- `GET /admin/stats` - Get system statistics

## 🔄 Real-Time Features

Supabase Realtime subscriptions for:
- **Messages**: Auto-refresh on new messages
- **Notifications**: Real-time updates (future enhancement)
- **Presence**: Online status tracking (future enhancement)

## 🛠️ Development

### Running Tests
```bash
npm run test  # Run test suite
```

### Building for Production
```bash
# Frontend
eas build --platform ios
eas build --platform android

# Backend
npm run build
npm start
```

### Environment Variables

**Frontend (.env)**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Backend (.env)**
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
JWT_SECRET=your_secret
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## 📝 Notes

- Specializations are hardcoded: 'SBL', 'Conventional', 'Powerlifting'
- Community IDs match specialization names (e.g., 'sbl-community')
- File uploads limited to 5MB by default
- JWT tokens expire in 7 days (no refresh token mechanism yet)
- Admin users have full moderation access

## 🚨 Known Limitations

- Profile picture uploads not fully implemented
- Real-time message subscriptions need lifecycle management
- Ranking recalculation runs on-demand only
- No push notifications system yet
- No email verification for signup

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Pull requests welcome! Please follow the existing code style and patterns.

## 📞 Support

For issues or questions, please open a GitHub issue or contact the development team.

---

**Last Updated**: May 19, 2026  
**Version**: 1.0.0  
**Status**: Active Development (Phase 7 - Polish)
