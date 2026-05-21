import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { User, SpecializationType } from '../../types';

interface ProfileScreenProps {
  onLogout: () => void;
  userId?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, userId: userIdProp }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [updatingSpec, setUpdatingSpec] = useState(false);
  
  // States for followers/following lists
  const [showUsersListModal, setShowUsersListModal] = useState(false);
  const [listType, setListType] = useState<'followers' | 'following'>('followers');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsersList, setLoadingUsersList] = useState(false);
  
  const { user, logout, setUser } = useAuth();
  const navigation = useNavigation();

  // Use prop if provided, otherwise default to current user's profile
  const targetUserId: string | undefined = userIdProp;

  const specs: SpecializationType[] = ['SBL', 'Conventional', 'Powerlifting'];

  // Fetch profile
  useEffect(() => {
    console.log('ProfileScreen - userId prop:', userIdProp, 'current user:', user?.id);

    const doFetch = async () => {
      // If viewing own profile (no userId prop), use current user's ID
      // Otherwise use the provided userId prop
      const idToFetch = userIdProp || user?.id;

      if (!idToFetch) {
        console.log('No userId to fetch (no prop and not authenticated), skipping');
        setLoading(false);
        return;
      }

      console.log('Fetching profile for userId:', idToFetch);
      try {
        setLoading(true);
        setIsFollowing(false);

        const data = await api.getUserProfile(idToFetch);
        console.log('Profile fetched:', data?.displayName, 'id:', data?.id, 'specialization:', data?.specialization);
        setProfile(data);

        // Check if currently following this user (only for other users' profiles)
        if (user?.id && idToFetch !== user.id) {
          try {
            const followers = await api.getFollowers(idToFetch);
            const followerIds = followers.map((f: User) => f.id);
            setIsFollowing(followerIds.includes(user.id));
          } catch (e) {
            console.error('Error checking follow status:', e);
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    doFetch();
  }, [userIdProp, user?.id]);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for userId:', userId);
    try {
      setLoading(true);
      const data = await api.getUserProfile(userId);
      console.log('Profile data received:', data?.displayName);
      setProfile(data);

      // Check if currently following this user
      if (user?.id && userId !== user.id) {
        try {
          const followers = await api.getFollowers(userId);
          const followingIds = followers.map((f: User) => f.id);
          setIsFollowing(followingIds.includes(user.id));
        } catch (e) {
          console.error('Error checking follow status:', e);
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              onLogout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleToggleFollow = async () => {
    if (!targetUserId || !user?.id) return;
    if (targetUserId === user.id) return;

    try {
      if (isFollowing) {
        await api.unfollowUser(targetUserId);
        setIsFollowing(false);
        // Optimistically update UI counts
        setProfile((p) =>
          p
            ? {
                ...p,
                followerCount: Math.max(0, (p.followerCount || 0) - 1),
              }
            : p
        );
        // Update current user's following count
        if (user) {
          setUser({
            ...user,
            followingCount: Math.max(0, (user.followingCount || 0) - 1),
          });
        }
      } else {
        await api.followUser(targetUserId);
        setIsFollowing(true);
        setProfile((p) =>
          p
            ? {
                ...p,
                followerCount: (p.followerCount || 0) + 1,
              }
            : p
        );
        // Update current user's following count
        if (user) {
          setUser({
            ...user,
            followingCount: (user.followingCount || 0) + 1,
          });
        }
      }
    } catch (e) {
      console.error('Follow/unfollow error:', e);
      Alert.alert('Error', 'Failed to update follow');
    }
  };

  const handleShowFollowers = async () => {
    const idToFetch = profile?.id;
    if (!idToFetch) return;
    
    setListType('followers');
    setShowUsersListModal(true);
    setLoadingUsersList(true);
    try {
      const followers = await api.getFollowers(idToFetch);
      setUsersList(followers);
    } catch (e) {
      console.error('Error fetching followers:', e);
      Alert.alert('Error', 'Failed to fetch followers');
    } finally {
      setLoadingUsersList(false);
    }
  };

  const handleShowFollowing = async () => {
    const idToFetch = profile?.id;
    if (!idToFetch) return;
    
    setListType('following');
    setShowUsersListModal(true);
    setLoadingUsersList(true);
    try {
      const following = await api.getFollowing(idToFetch);
      setUsersList(following);
    } catch (e) {
      console.error('Error fetching following:', e);
      Alert.alert('Error', 'Failed to fetch following');
    } finally {
      setLoadingUsersList(false);
    }
  };

  const handleSpecializationChange = async (newSpec: SpecializationType) => {
    if (!profile?.id) return;

    try {
      setUpdatingSpec(true);
      await api.updateUserProfile(profile.id, { specialization: newSpec });
      setProfile({ ...profile, specialization: newSpec });
      
      // Update current user context if it's own profile
      if (user?.id === profile.id) {
        setUser({ ...user, specialization: newSpec });
      }
      
      setShowSpecModal(false);
      Alert.alert('Success', 'Specialization updated!');
    } catch (error: any) {
      console.error('Update specialization error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update specialization');
    } finally {
      setUpdatingSpec(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  const isOwnProfile = !!user?.id && (!targetUserId || user.id === targetUserId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.headerEyebrow}>PRBOARD</Text>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerAccent} />
      </View>

      <View style={styles.header}>
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImageText}>👤</Text>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]}
            onPress={handleToggleFollow}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{isFollowing ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {profile?.bio && (
        <View style={styles.bioSection}>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statItem} onPress={handleShowFollowers} activeOpacity={0.7}>
          <Text style={styles.statValue}>{profile?.followerCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={handleShowFollowing} activeOpacity={0.7}>
          <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.specializationSection}
        onPress={() => isOwnProfile && setShowSpecModal(true)}
        disabled={!isOwnProfile}
      >
        <Text style={styles.specializationLabel}>Lifting Specialization</Text>
        <View style={styles.specializationTagLarge}>
          <Text style={styles.specializationTextLarge}>
            {profile?.specialization || 'Not Set'}
          </Text>
        </View>
        {isOwnProfile && (
          <Text style={styles.editHint}>Tap to edit</Text>
        )}
      </TouchableOpacity>

      {profile?.stats && (
        <View style={styles.liftingStatsSection}>
          <Text style={styles.liftingStatsTitle}>Lifting Stats</Text>
          {profile.stats.weight && (
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Weight:</Text>
              <Text style={styles.statValueText}>{profile.stats.weight} lbs</Text>
            </View>
          )}
          {profile.stats.squatPr && (
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Squat PR:</Text>
              <Text style={styles.statValueText}>{profile.stats.squatPr} lbs</Text>
            </View>
          )}
          {profile.stats.benchPr && (
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Bench PR:</Text>
              <Text style={styles.statValueText}>{profile.stats.benchPr} lbs</Text>
            </View>
          )}
          {profile.stats.deadliftPr && (
            <View style={styles.statRow}>
              <Text style={styles.statKey}>Deadlift PR:</Text>
              <Text style={styles.statValueText}>{profile.stats.deadliftPr} lbs</Text>
            </View>
          )}
        </View>
      )}

      {profile?.isAdmin && (
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => {
            (navigation as any).navigate('admin');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>⚙️ Admin Panel</Text>
        </TouchableOpacity>
      )}

      {isOwnProfile && (
        <>
          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={() => {
              (navigation as any).navigate('settings');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>⚙️ Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Specialization Modal */}
      <Modal
        visible={showSpecModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Specialization</Text>
            
            <View style={styles.specOptions}>
              {specs.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specOption,
                    profile?.specialization === spec && styles.specOptionSelected,
                  ]}
                  onPress={() => handleSpecializationChange(spec)}
                  disabled={updatingSpec}
                >
                  <Text
                    style={[
                      styles.specOptionText,
                      profile?.specialization === spec && styles.specOptionTextSelected,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSpecModal(false)}
              disabled={updatingSpec}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>

            {updatingSpec && <ActivityIndicator size="large" color="#FF4D4D" style={styles.loadingIndicator} />}
          </View>
        </View>
      </Modal>

      {/* Users List Modal (Followers/Following) */}
      <Modal
        visible={showUsersListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUsersListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>
              {listType === 'followers' ? 'Followers' : 'Following'}
            </Text>
            
            {loadingUsersList ? (
              <ActivityIndicator size="large" color="#FF4D4D" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={usersList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => {
                      setShowUsersListModal(false);
                      // Navigate to user profile
                      (navigation as any).navigate('user-profile', { userId: item.id });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarEmoji}>💪</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.displayName}>{item.displayName || item.username}</Text>
                      <Text style={styles.handle}>@{item.username}</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>
                      No {listType} yet
                    </Text>
                  </View>
                }
                style={{ width: '100%' }}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={[styles.modalCloseButton, { marginTop: 16 }]}
              onPress={() => setShowUsersListModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  // PRBOARD page header
  pageHeader: {
    marginBottom: 4,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#FF4D4D',
    borderRadius: 2,
    marginTop: 6,
  },
  // Profile card
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF4D4D',
  },
  profileImageText: {
    fontSize: 48,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  // Bio
  bioSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bio: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  // Follower stats
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Specialization
  specializationSection: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  specializationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4D4D',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  specializationTagLarge: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  specializationTextLarge: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  editHint: {
    fontSize: 10,
    color: '#444',
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Lifting stats
  liftingStatsSection: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  liftingStatsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4D4D',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  statKey: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Buttons
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  followButton: {
    backgroundColor: '#FF4D4D',
    marginTop: 12,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  followingButton: {
    backgroundColor: '#1A1A1A',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  settingsButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  adminButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#FF4D4D',
  },
  logoutButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Specialization tag (small, unused in current JSX but kept for compat)
  specializationTag: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specializationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  specOptions: {
    gap: 10,
    marginBottom: 20,
  },
  specOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  specOptionSelected: {
    backgroundColor: '#FF4D4D',
    borderColor: '#FF4D4D',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  specOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  specOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalCloseButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingIndicator: {
    marginTop: 16,
  },
  // User list items (for followers/following modal)
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '100%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginRight: 12,
  },
  userAvatarEmoji: {
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  handle: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#FF4D4D',
    fontWeight: '700',
  },
  emptyListContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#555',
    fontSize: 14,
  },
});

export default ProfileScreen;
