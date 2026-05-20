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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/theme';
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const isOwnProfile = !!user?.id && (!targetUserId || user.id === targetUserId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.profileImagePlaceholder}>
          <Text style={styles.profileImageText}>👤</Text>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]}
            onPress={handleToggleFollow}
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
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.followerCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
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
          >
            <Text style={styles.buttonText}>⚙️ Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
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

            {updatingSpec && <ActivityIndicator size="large" color="#FF6B6B" style={styles.loadingIndicator} />}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageText: {
    fontSize: 48,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  specializationTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specializationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bioSection: {
    paddingHorizontal: 8,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 8,
  },

  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  specializationSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 8,
    alignItems: 'center',
  },
  specializationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specializationTagLarge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  specializationTextLarge: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  editHint: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  liftingStatsSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 8,
  },

  liftingStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statKey: {
    fontSize: 14,
    color: Colors.light.textSecondary,

  },
  statValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  followButton: {
    backgroundColor: '#FF6B6B',
  },
  followingButton: {
    backgroundColor: '#4CAF50',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
  },
  adminButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  specOptions: {
    gap: 12,
    marginBottom: 20,
  },
  specOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSelected,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  specOptionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF5252',
  },
  specOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  specOptionTextSelected: {
    color: 'white',
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#999',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 16,
  },
});

export default ProfileScreen;
