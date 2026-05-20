// User type definitions

export type SpecializationType = 'SBL' | 'Conventional' | 'Powerlifting';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  specialization?: SpecializationType;
  followerCount?: number;
  followingCount?: number;
  stats?: UserStats;
  isAdmin?: boolean;
  isSuspended?: boolean;
  isBanned?: boolean;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  weight?: number;
  squatPr?: number;
  benchPr?: number;
  deadliftPr?: number;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  communityId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
  lastMessageAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface Community {
  id: string;
  name: string;
  specializationType: SpecializationType;
  description?: string;
}

export interface RankingEntry {
  rank: number;
  score: number;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    profilePictureUrl?: string;
  };
}
