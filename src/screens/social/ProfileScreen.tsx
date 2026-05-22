import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { User } from '../../types';

interface ProfileScreenProps {
  onLogout: () => void;
  userId?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, userId: userIdProp }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [showUsersListModal, setShowUsersListModal] = useState(false);
  const [listType, setListType] = useState<'followers' | 'following'>('followers');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsersList, setLoadingUsersList] = useState(false);
  const { user, logout, setUser } = useAuth();
  const navigation = useNavigation();

  const targetUserId: string | undefined = userIdProp;
  const isOwnProfile = !!user?.id && (!targetUserId || user.id === targetUserId);

  useEffect(() => {
    const idToFetch = userIdProp || user?.id;
    if (!idToFetch) { setLoading(false); return; }
    const doFetch = async () => {
      try {
        setLoading(true);
        setIsFollowing(false);
        setIsBlocked(false);
        const data = await api.getUserProfile(idToFetch);
        setProfile(data);
        if (user?.id && idToFetch !== user.id) {
          try {
            const followers = await api.getFollowers(idToFetch);
            setIsFollowing(followers.map((f: User) => f.id).includes(user.id));
          } catch (e) {}
          // Check if blocked
          try {
            const blocked = await api.getBlockedUsers();
            setIsBlocked(blocked.some((b: any) => b.id === idToFetch));
          } catch (e) {}
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [userIdProp, user?.id]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          try { await logout(); onLogout(); }
          catch { Alert.alert('Error', 'Failed to logout'); }
        },
      },
    ]);
  };

  const handleToggleFollow = async () => {
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    try {
      if (isFollowing) {
        await api.unfollowUser(targetUserId);
        setIsFollowing(false);
        setProfile(p => p ? { ...p, followerCount: Math.max(0, (p.followerCount || 0) - 1) } : p);
        if (user) setUser({ ...user, followingCount: Math.max(0, (user.followingCount || 0) - 1) });
      } else {
        await api.followUser(targetUserId);
        setIsFollowing(true);
        setProfile(p => p ? { ...p, followerCount: (p.followerCount || 0) + 1 } : p);
        if (user) setUser({ ...user, followingCount: (user.followingCount || 0) + 1 });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update follow');
    }
  };

  const handleToggleBlock = async () => {
    if (!targetUserId || !user?.id) return;
    const action = isBlocked ? 'Unblock' : 'Block';
    const message = isBlocked
      ? `Unblock @${profile?.username}? They will be able to see your posts and follow you again.`
      : `Block @${profile?.username}? They won't be able to see your posts or message you.`;

    Alert.alert(action, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action, style: isBlocked ? 'default' : 'destructive',
        onPress: async () => {
          try {
            setBlockingUser(true);
            await api.blockUser(targetUserId);
            setIsBlocked(!isBlocked);
            if (!isBlocked) {
              // If we just blocked, also unfollow
              setIsFollowing(false);
              setProfile(p => p ? { ...p, followerCount: Math.max(0, (p.followerCount || 0) - 1) } : p);
            }
            Alert.alert('✅ Done', isBlocked ? `@${profile?.username} unblocked` : `@${profile?.username} blocked`);
          } catch (e) {
            Alert.alert('Error', 'Failed to update block');
          } finally {
            setBlockingUser(false);
          }
        },
      },
    ]);
  };

  const handleShowFollowers = async () => {
    if (!profile?.id) return;
    setListType('followers');
    setShowUsersListModal(true);
    setLoadingUsersList(true);
    try { setUsersList(await api.getFollowers(profile.id)); }
    catch { Alert.alert('Error', 'Failed to fetch followers'); }
    finally { setLoadingUsersList(false); }
  };

  const handleShowFollowing = async () => {
    if (!profile?.id) return;
    setListType('following');
    setShowUsersListModal(true);
    setLoadingUsersList(true);
    try { setUsersList(await api.getFollowing(profile.id)); }
    catch { Alert.alert('Error', 'Failed to fetch following'); }
    finally { setLoadingUsersList(false); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>PRBOARD</Text>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.accent} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>💪</Text>
        </View>
        <Text style={styles.username}>@{profile?.username}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {/* Follow + Block buttons for other users */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleToggleFollow}
              activeOpacity={0.85}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.blockBtn, isBlocked && styles.blockedBtn]}
              onPress={handleToggleBlock}
              disabled={blockingUser}
              activeOpacity={0.85}
            >
              <Text style={[styles.blockBtnText, isBlocked && styles.blockedBtnText]}>
                {blockingUser ? '...' : isBlocked ? 'Unblock' : '🚫 Block'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statBox} onPress={handleShowFollowers} activeOpacity={0.7}>
          <Text style={styles.statValue}>{profile?.followerCount || 0}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statBox} onPress={handleShowFollowing} activeOpacity={0.7}>
          <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>FOLLOWING</Text>
        </TouchableOpacity>
      </View>

      {/* PRs */}
      {profile?.stats && (
        <View style={styles.liftingCard}>
          <Text style={styles.sectionEyebrow}>PERSONAL RECORDS</Text>
          {profile.stats.weight ? (
            <View style={styles.prRow}>
              <View style={styles.prLeft}><Text style={styles.prIcon}>⚖️</Text><Text style={styles.prLabel}>Body Weight</Text></View>
              <Text style={styles.prValue}>{profile.stats.weight} <Text style={styles.prUnit}>lbs</Text></Text>
            </View>
          ) : null}
          {profile.stats.squatPr ? (
            <View style={styles.prRow}>
              <View style={styles.prLeft}><Text style={styles.prIcon}>🦵</Text><Text style={styles.prLabel}>Squat PR</Text></View>
              <Text style={styles.prValue}>{profile.stats.squatPr} <Text style={styles.prUnit}>lbs</Text></Text>
            </View>
          ) : null}
          {profile.stats.benchPr ? (
            <View style={styles.prRow}>
              <View style={styles.prLeft}><Text style={styles.prIcon}>💪</Text><Text style={styles.prLabel}>Bench PR</Text></View>
              <Text style={styles.prValue}>{profile.stats.benchPr} <Text style={styles.prUnit}>lbs</Text></Text>
            </View>
          ) : null}
          {profile.stats.deadliftPr ? (
            <View style={[styles.prRow, { borderBottomWidth: 0 }]}>
              <View style={styles.prLeft}><Text style={styles.prIcon}>🏋️</Text><Text style={styles.prLabel}>Deadlift PR</Text></View>
              <Text style={styles.prValue}>{profile.stats.deadliftPr} <Text style={styles.prUnit}>lbs</Text></Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Own profile buttons */}
      {isOwnProfile && (
        <View style={styles.ownButtons}>
          {profile?.isAdmin && (
            <TouchableOpacity style={styles.adminBtn} onPress={() => (navigation as any).navigate('admin')} activeOpacity={0.85}>
              <Text style={styles.adminBtnText}>⚙️  Admin Panel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsBtn} onPress={() => (navigation as any).navigate('settings')} activeOpacity={0.85}>
            <Text style={styles.settingsBtnText}>⚙️  Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={styles.logoutBtnText}>🚪  Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Followers/Following Modal */}
      <Modal visible={showUsersListModal} transparent animationType="slide" onRequestClose={() => setShowUsersListModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>{listType === 'followers' ? 'FOLLOWERS' : 'FOLLOWING'}</Text>
            {loadingUsersList ? (
              <ActivityIndicator size="large" color="#FF4D4D" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={usersList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => { setShowUsersListModal(false); (navigation as any).navigate('user-profile', { userId: item.id }); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userAvatar}><Text style={styles.userAvatarEmoji}>💪</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.displayName || item.username}</Text>
                      <Text style={styles.userHandle}>@{item.username}</Text>
                    </View>
                    <Text style={styles.userArrow}>›</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<View style={{ paddingVertical: 30, alignItems: 'center' }}><Text style={{ color: '#555', fontSize: 14 }}>No {listType} yet</Text></View>}
                style={{ width: '100%', maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
              />
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowUsersListModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
  content: { paddingHorizontal: 20, paddingVertical: 24, gap: 14 },
  pageHeader: { marginBottom: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2.5, marginBottom: 4 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  accent: { width: 40, height: 3, backgroundColor: '#FF4D4D', borderRadius: 2, marginTop: 6 },
  profileCard: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF4D4D44', marginBottom: 14 },
  avatarEmoji: { fontSize: 40 },
  username: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.3 },
  bio: { fontSize: 13, color: '#777', textAlign: 'center', paddingHorizontal: 20, lineHeight: 18, marginBottom: 4 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  followBtn: { backgroundColor: '#FF4D4D', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 11, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#2A2A2A', shadowOpacity: 0, elevation: 0 },
  followBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  followingBtnText: { color: '#555' },
  blockBtn: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1.5, borderColor: '#2A2A2A' },
  blockedBtn: { borderColor: '#FF4D4D44', backgroundColor: '#FF4D4D11' },
  blockBtnText: { fontSize: 14, fontWeight: '700', color: '#888' },
  blockedBtnText: { color: '#FF4D4D' },
  statsRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#2A2A2A', marginVertical: 4 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#444', letterSpacing: 1.5, marginTop: 4 },
  liftingCard: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  sectionEyebrow: { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 2, marginBottom: 12 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  prLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prIcon: { fontSize: 18 },
  prLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  prValue: { fontSize: 18, fontWeight: '800', color: '#FF4D4D' },
  prUnit: { fontSize: 12, fontWeight: '500', color: '#555' },
  ownButtons: { gap: 10 },
  settingsBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  settingsBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  logoutBtn: { backgroundColor: '#FF4D4D22', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF4D4D44' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#FF4D4D' },
  adminBtn: { backgroundColor: '#1A2A1A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A4D2A' },
  adminBtnText: { fontSize: 15, fontWeight: '700', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderTopWidth: 1, borderColor: '#2A2A2A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalEyebrow: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A', marginRight: 12 },
  userAvatarEmoji: { fontSize: 18 },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  userHandle: { fontSize: 12, color: '#555', fontWeight: '500' },
  userArrow: { fontSize: 18, color: '#FF4D4D', fontWeight: '700' },
  modalCloseBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  modalCloseBtnText: { color: '#555', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
