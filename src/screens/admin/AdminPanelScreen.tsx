import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { User } from '../../types';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  suspendedUsers: number;
  bannedUsers: number;
}

interface UserItemProps {
  user: User;
  onSelectUser: (user: User) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onSelectUser }) => {
  return (
    <TouchableOpacity style={styles.userItem} onPress={() => onSelectUser(user)}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.username}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <View style={styles.statusBadge}>
        {user.isBanned && <Text style={styles.bannedBadge}>BANNED</Text>}
        {user.isSuspended && <Text style={styles.suspendedBadge}>SUSPENDED</Text>}
        {!user.isBanned && !user.isSuspended && <Text style={styles.activeBadge}>ACTIVE</Text>}
      </View>
    </TouchableOpacity>
  );
};

interface AdminPanelScreenProps {
  onSelectUser?: (user: User) => void;
}

export default function AdminPanelScreen({ onSelectUser }: AdminPanelScreenProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAllUsers(100, 0),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Admin data fetch error:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.isAdmin) {
        fetchAdminData();
      }
    }, [currentUser, fetchAdminData])
  );

  const handleUserPress = (user: User) => {
    if (onSelectUser) {
      onSelectUser(user);
    } else {
      setSelectedUser(user);
    }
  };

  const handleBanUser = (userId: string) => {
    Alert.prompt(
      'Ban User',
      'Enter ban reason:',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Ban',
          onPress: async (reason: string | undefined) => {
            try {
              await api.banUser(userId, reason || 'No reason provided');
              Alert.alert('Success', 'User has been banned');
              fetchAdminData();
            } catch (error) {
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = (userId: string) => {
    Alert.alert('Unban User?', 'This will restore the user account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unban',
        onPress: async () => {
          try {
            await api.unbanUser(userId);
            Alert.alert('Success', 'User has been unbanned');
            fetchAdminData();
          } catch (error) {
            Alert.alert('Error', 'Failed to unban user');
          }
        },
      },
    ]);
  };

  if (loading && !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Admin Dashboard</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.totalPosts || 0}</Text>
              <Text style={styles.statLabel}>Total Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.suspendedUsers || 0}</Text>
              <Text style={styles.statLabel}>Suspended</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.bannedUsers || 0}</Text>
              <Text style={styles.statLabel}>Banned</Text>
            </View>
          </View>
        </View>

        {/* Selected User Details */}
        {selectedUser && (
          <View style={styles.selectedUserSection}>
            <Text style={styles.sectionTitle}>Selected User</Text>
            <View style={styles.selectedUserCard}>
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserName}>{selectedUser.username}</Text>
                <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
              </View>
              <View style={styles.selectedUserActions}>
                {selectedUser.isBanned ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.unbanButton]}
                    onPress={() => handleUnbanUser(selectedUser.id)}
                  >
                    <Text style={styles.actionButtonText}>Unban</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.banButton]}
                    onPress={() => handleBanUser(selectedUser.id)}
                  >
                    <Text style={styles.actionButtonText}>Ban</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.closeButton]}
                  onPress={() => setSelectedUser(null)}
                >
                  <Text style={styles.actionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Users List Section */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>User Management</Text>
        </View>
      </ScrollView>

      {/* Users List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserItem user={item} onSelectUser={handleUserPress} />
        )}
        style={styles.usersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  selectedUserSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedUserCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  selectedUserInfo: {
    marginBottom: 12,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  selectedUserHandle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  selectedUserEmail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  selectedUserActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  banButton: {
    backgroundColor: '#FF6B6B',
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: Colors.light.textSecondary,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  usersSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  userHandle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    alignItems: 'flex-end',
  },
  activeBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  suspendedBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bannedBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  usersList: {
    flex: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
