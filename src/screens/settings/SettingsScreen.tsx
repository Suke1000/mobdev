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

interface SettingsOption {
  id: string;
  label: string;
  value: ThemeOption;
}

const themeOptions: SettingsOption[] = [
  { id: 'light', label: '☀️ Light', value: 'light' },
  { id: 'dark', label: '🌙 Dark', value: 'dark' },
  { id: 'auto', label: '🔄 Auto', value: 'auto' },
];

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useThemeContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messagesNotifications, setMessagesNotifications] = useState(true);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data will be exported as JSON. This feature will be available soon.');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const currentColors = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Theme Section */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Appearance</Text>

        <View style={styles.themeOptions}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.themeOption,
                theme === option.value && styles.themeOptionActive,
                { borderColor: isDark ? '#444' : '#ddd' },
              ]}
              onPress={() => handleThemeChange(option.value)}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === option.value && styles.themeOptionTextActive,
                  { color: theme === option.value ? 'white' : currentColors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: currentColors.text }]}>
              Push Notifications
            </Text>
            <Text style={[styles.settingDescription, { color: currentColors.textSecondary }]}>
              Receive push notifications for activity
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={notificationsEnabled ? '#FF6B6B' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: currentColors.text }]}>
              Message Notifications
            </Text>
            <Text style={[styles.settingDescription, { color: currentColors.textSecondary }]}>
              Get notified when you receive messages
            </Text>
          </View>
          <Switch
            value={messagesNotifications}
            onValueChange={setMessagesNotifications}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={messagesNotifications ? '#FF6B6B' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={[styles.section, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Privacy & Data</Text>

        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: isDark ? '#212225' : '#F0F0F3' }]}
          onPress={handleExportData}
        >
          <Text style={[styles.settingButtonText, { color: currentColors.text }]}>
            📥 Export My Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: isDark ? '#212225' : '#F0F0F3' }]}
          onPress={handleClearCache}
        >
          <Text style={[styles.settingButtonText, { color: currentColors.text }]}>
            🗑️ Clear Cache
          </Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>About</Text>

        <View style={styles.aboutItem}>
          <Text style={[styles.aboutLabel, { color: currentColors.textSecondary }]}>
            App Version
          </Text>
          <Text style={[styles.aboutValue, { color: currentColors.text }]}>1.0.0</Text>
        </View>

        <View style={styles.aboutItem}>
          <Text style={[styles.aboutLabel, { color: currentColors.textSecondary }]}>
            Build Number
          </Text>
          <Text style={[styles.aboutValue, { color: currentColors.text }]}>1</Text>
        </View>

        <View style={[styles.aboutItem, { borderBottomWidth: 0 }]}>
          <Text style={[styles.aboutLabel, { color: currentColors.textSecondary }]}>
            Last Updated
          </Text>
          <Text style={[styles.aboutValue, { color: currentColors.text }]}>May 19, 2026</Text>
        </View>
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
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeOptionActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeOptionTextActive: {
    color: 'white',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLabel: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  settingButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  aboutLabel: {
    fontSize: 13,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
