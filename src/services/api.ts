import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User, AuthResponse, Post, Message, Conversation, RankingEntry } from '../types';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  suspendedUsers: number;
  bannedUsers: number;
}

// Get API URL from environment or use default
// Note: For React Native on device/emulator, use your computer's IP address instead of localhost
// Example: http://192.168.1.100:3000
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // 10.0.2.2 works for Android emulator

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {

    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });


    // Add interceptor to attach token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
        }
        throw error;
      }
    );
  }

  // Auth methods
  async signup(
    email: string,
    password: string,
    username: string,
    specialization: string
  ): Promise<AuthResponse> {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      username,
      specialization,
    });
    const token: string = response.data.token;
    this.token = token;
    await this.saveToken(token);
    return response.data;

  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/login', {
      username,
      password,
    });
    const token: string = response.data.token;
    this.token = token;
    await this.saveToken(token);

    return response.data;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getStoredToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        this.token = token;
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private clearToken(): void {
    this.token = null;
    try {
      SecureStore.deleteItemAsync('authToken').catch(() => {});
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userStr = await SecureStore.getItemAsync('authUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync('authUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async deleteStoredUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authUser').catch(() => {});
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  }

  // User methods
  async searchUsers(query: string): Promise<User[]> {
    const response = await this.client.get('/users/search', {
      params: { query },
    });
    return response.data.users;
  }

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.client.get(`/users/${userId}`);
    console.log('API getUserProfile response:', response.data);
    return response.data.user;
  }

  async updateUserProfile(userId: string, data: Partial<User & { weight?: number; squat_pr?: number; bench_pr?: number; deadlift_pr?: number }>): Promise<void> {
    await this.client.put(`/users/${userId}`, data);
  }

  async getUserPosts(userId: string, limit = 20, offset = 0): Promise<Post[]> {
    const response = await this.client.get(`/users/${userId}/posts`, {
      params: { limit, offset },
    });
    return response.data.posts;
  }

  // Post methods
  async createPost(content: string, imageFile?: any, communityId?: string): Promise<Post> {
    const formData = new FormData();
    formData.append('content', content);
    if (communityId) {
      formData.append('communityId', communityId);
    }
    
    // Handle image file properly for multipart/form-data
    if (imageFile && imageFile.uri) {
      const imageUri = imageFile.uri;
      const fileName = imageFile.fileName || `image_${Date.now()}.jpg`;
      const fileType = imageFile.mimeType || 'image/jpeg';
      
      const imagePart: any = {
        uri: imageUri,
        type: fileType,
        name: fileName,
      };
      formData.append('image', imagePart);
    }

    const response = await this.client.post('/posts', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Backend returns { message, post }, extract the post
    return response.data.post || response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/change-password', { currentPassword, newPassword });
  }
 
  async deleteAccount(password: string): Promise<void> {
    await this.client.delete('/auth/delete-account', { data: { password } });
  }
 
  async blockUser(userId: string): Promise<{ blocked: boolean }> {
    const response = await this.client.post(`/users/${userId}/block`);
    return response.data;
  }
 
  async getBlockedUsers(): Promise<any[]> {
    const response = await this.client.get('/users/blocks/list');
    return response.data.blockedUsers;
  }

  async getFeed(limit = 20, offset = 0): Promise<Post[]> {
    const response = await this.client.get('/posts/feed', {
      params: { limit, offset },
    });
    return response.data.posts;
  }

  async getAllPosts(limit = 20, offset = 0, communityId?: string): Promise<Post[]> {
    const response = await this.client.get('/posts', {
      params: { limit, offset, communityId },
    });
    return response.data.posts;
  }

  async deletePost(postId: string): Promise<void> {
    await this.client.delete(`/posts/${postId}`);
  }

  async likePost(postId: string): Promise<{ liked: boolean }> {
    const response = await this.client.post(`/posts/${postId}/like`);
    return response.data;
  }
 
  async getComments(postId: string): Promise<any[]> {
    const response = await this.client.get(`/posts/${postId}/comments`);
    return response.data.comments;
  }
 
  async addComment(postId: string, content: string): Promise<any> {
    const response = await this.client.post(`/posts/${postId}/comments`, { content });
    return response.data.comment;
  }

  // Follow methods
  async followUser(userId: string): Promise<void> {
    await this.client.post(`/follow/${userId}`);
  }

  async unfollowUser(userId: string): Promise<void> {
    await this.client.delete(`/follow/${userId}`);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const response = await this.client.get(`/follow/${userId}/followers`);
    return response.data.followers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const response = await this.client.get(`/follow/${userId}/following`);
    return response.data.following;
  }

  // Message methods
  async sendMessage(recipientId: string, content: string): Promise<Message> {
    const response = await this.client.post('/messages', {
      recipientId,
      content,
    });
    return response.data.data;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.client.get('/messages/conversations');
    return response.data.conversations || [];
  }

  async getMutualFollowers(): Promise<User[]> {
    const response = await this.client.get('/messages/mutual-followers');
    return response.data || [];
  }

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await this.client.get(`/messages/${conversationId}`, {
      params: { limit, offset },
    });
    return response.data.messages;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.client.put(`/messages/${messageId}/read`);
  }

  // Rankings methods
  async getRankings(limit = 50, offset = 0): Promise<RankingEntry[]> {
    const response = await this.client.get('/rankings', {
      params: { limit, offset },
    });
 
    const raw = response.data.rankings || [];
    console.log('Raw rankings:', JSON.stringify(raw, null, 2));
    return raw;
  }

  async getAllRankings(): Promise<Record<string, any>> {
    const response = await this.client.get('/rankings');
    return response.data.rankings;
  }

  // Admin methods
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    const response = await this.client.get('/admin/users', {
      params: { limit, offset },
    });
    return response.data.users;
  }

  async getUserDetails(userId: string): Promise<User> {
    const response = await this.client.get(`/admin/users/${userId}`);
    return response.data.user;
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await this.client.post(`/admin/users/${userId}/suspend`, { reason });
  }

  async banUser(userId: string, reason: string): Promise<void> {
    await this.client.post(`/admin/users/${userId}/ban`, { reason });
  }

  async unbanUser(userId: string): Promise<void> {
    await this.client.post(`/admin/users/${userId}/unban`);
  }

  async getAdminStats(): Promise<AdminStats> {
    const response = await this.client.get('/admin/stats');
    return response.data.stats;
  }
}

export default new ApiService();
