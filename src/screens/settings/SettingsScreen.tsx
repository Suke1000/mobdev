import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useThemeContext } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/theme';

type ThemeOption = 'light' | 'dark' | 'auto';

const themeOptions: { id: ThemeOption; label: string }[] = [
  { id: 'light', label: '☀️ Light' },
  { id: 'dark', label: '🌙 Dark' },
  { id: 'auto', label: '🔄 Auto' },
];

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useThemeContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messagesNotifications, setMessagesNotifications] = useState(true);
  const currentColors = isDark ? Colors.dark : Colors.light;

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will remove cached data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared'), style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]}>

      {/* Appearance */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Appearance</Text>
        <View style={styles.optionRow}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                theme === option.id && styles.optionActive,
                { borderColor: isDark ? '#444' : '#ddd' },
              ]}
              onPress={() => setTheme(option.id)}
            >
              <Text style={[
                styles.optionText,
                { color: theme === option.id ? 'white' : currentColors.text },
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: currentColors.text }]}>Push Notifications</Text>
            <Text style={[styles.settingDesc, { color: currentColors.textSecondary }]}>
              Receive push notifications for activity
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={notificationsEnabled ? '#FF4D4D' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: currentColors.text }]}>Message Notifications</Text>
            <Text style={[styles.settingDesc, { color: currentColors.textSecondary }]}>
              Get notified when you receive messages
            </Text>
          </View>
          <Switch
            value={messagesNotifications}
            onValueChange={setMessagesNotifications}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={messagesNotifications ? '#FF4D4D' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Data */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Privacy & Data</Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: isDark ? '#212225' : '#F0F0F3' }]}
          onPress={handleClearCache}
        >
          <Text style={[styles.btnText, { color: currentColors.text }]}>🗑️ Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>About</Text>
        {[
          { label: 'App Version', value: '1.0.0' },
          { label: 'Build Number', value: '1' },
          { label: 'Last Updated', value: 'May 2026' },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.aboutRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[styles.aboutLabel, { color: currentColors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.aboutValue, { color: currentColors.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>
          PRboard © 2026 - Gym Social Network
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 2, alignItems: 'center',
  },
  optionActive: { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  optionText: { fontSize: 12, fontWeight: '600' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLabel: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  btnText: { fontSize: 14, fontWeight: '500' },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  aboutLabel: { fontSize: 13 },
  aboutValue: { fontSize: 13, fontWeight: '600' },
  footer: { paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center' },
  footerText: { fontSize: 12, textAlign: 'center' },
});
