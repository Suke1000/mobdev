import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView,
  TouchableOpacity, Alert, TextInput, Modal,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Blocked users modal
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    try {
      setChangingPassword(true);
      await api.changePassword(currentPassword, newPassword);
      Alert.alert('✅ Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    try {
      setDeletingAccount(true);
      await api.deleteAccount(deletePassword);
      await logout();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleOpenBlocked = async () => {
    setShowBlockedModal(true);
    setLoadingBlocked(true);
    try {
      const data = await api.getBlockedUsers();
      setBlockedUsers(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    try {
      await api.blockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      Alert.alert('✅ Unblocked', `@${username} has been unblocked`);
    } catch (e) {
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const handleReportBug = () => Alert.alert('Report a Bug', 'Send your bug report to support@prboard.app');
  const handleRateApp = () => Alert.alert('Rate PRboard', 'Rating will be available when the app is published.');

  const ActionBtn = ({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={[styles.actionBtn, danger && styles.actionBtnDanger]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.actionBtnText, danger && styles.actionBtnTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <ActionBtn label="🔑  Change Password" onPress={() => setShowPasswordModal(true)} />
        <ActionBtn label="🚫  Blocked Users" onPress={handleOpenBlocked} />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <ActionBtn label="🐛  Report a Bug" onPress={handleReportBug} />
        <ActionBtn label="⭐  Rate PRboard" onPress={handleRateApp} />
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        {[
          { label: 'App Version', value: '1.0.0' },
          { label: 'Build', value: '1' },
          { label: 'Last Updated', value: 'May 2026' },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.aboutRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.aboutLabel}>{item.label}</Text>
            <Text style={styles.aboutValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        <ActionBtn label="🗑️  Delete Account" onPress={() => setShowDeleteModal(true)} danger />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PRboard © 2026 · Gym Social Network</Text>
      </View>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>ACCOUNT SECURITY</Text>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Enter current password" placeholderTextColor="#444"
                value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Min. 6 characters" placeholderTextColor="#444"
                value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Repeat new password" placeholderTextColor="#444"
                value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, changingPassword && { opacity: 0.5 }]}
              onPress={handleChangePassword} disabled={changingPassword} activeOpacity={0.85}
            >
              {changingPassword ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalEyebrow, { color: '#FF4D4D' }]}>⚠️ DANGER ZONE</Text>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDesc}>This will permanently delete your account, posts, and all data. This cannot be undone.</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="#444"
                value={deletePassword} onChangeText={setDeletePassword} secureTextEntry />
            </View>

            <TouchableOpacity
              style={[styles.dangerBtn, deletingAccount && { opacity: 0.5 }]}
              onPress={handleDeleteAccount} disabled={deletingAccount} activeOpacity={0.85}
            >
              {deletingAccount ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.dangerBtnText}>Permanently Delete Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowDeleteModal(false); setDeletePassword(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedModal} transparent animationType="slide" onRequestClose={() => setShowBlockedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>PRIVACY</Text>
            <Text style={styles.modalTitle}>Blocked Users</Text>
            {loadingBlocked ? (
              <ActivityIndicator size="large" color="#FF4D4D" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={item => item.id}
                style={{ maxHeight: 300, width: '100%' }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.blockedUserRow}>
                    <View style={styles.blockedAvatar}><Text style={{ fontSize: 16 }}>💪</Text></View>
                    <Text style={styles.blockedUsername}>@{item.username}</Text>
                    <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item.id, item.username)}>
                      <Text style={styles.unblockBtnText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <Text style={{ color: '#555', fontSize: 14 }}>No blocked users</Text>
                  </View>
                }
              />
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBlockedModal(false)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2A2A2A', gap: 10 },
  dangerSection: { borderColor: '#FF4D4D44' },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2, marginBottom: 4 },
  actionBtn: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#0F0F0F' },
  actionBtnDanger: { borderColor: '#FF4D4D44', backgroundColor: '#FF4D4D11' },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  actionBtnTextDanger: { color: '#FF4D4D' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  aboutLabel: { fontSize: 13, color: '#555' },
  aboutValue: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  footer: { paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#333' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderTopWidth: 1, borderColor: '#2A2A2A', gap: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalEyebrow: { fontSize: 10, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  modalDesc: { fontSize: 13, color: '#777', lineHeight: 18 },
  inputWrapper: { gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 1.5 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#FFFFFF', borderWidth: 1, borderColor: '#2A2A2A' },
  primaryBtn: { backgroundColor: '#FF4D4D', borderRadius: 12, paddingVertical: 15, alignItems: 'center', shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  dangerBtn: { backgroundColor: '#FF4D4D22', borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: '#FF4D4D' },
  dangerBtnText: { color: '#FF4D4D', fontSize: 15, fontWeight: '800' },
  cancelBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  cancelBtnText: { color: '#555', fontSize: 14, fontWeight: '700' },
  blockedUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  blockedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  blockedUsername: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  unblockBtn: { backgroundColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2A2A2A' },
  unblockBtnText: { fontSize: 12, fontWeight: '700', color: '#FF4D4D' },
});
