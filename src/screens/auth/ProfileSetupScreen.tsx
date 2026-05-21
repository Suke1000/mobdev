import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface ProfileSetupScreenProps {
  onCompleted: () => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onCompleted }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [weight, setWeight] = useState('');
  const [squatPr, setSquatPr] = useState('');
  const [benchPr, setBenchPr] = useState('');
  const [deadliftPr, setDeadliftPr] = useState('');
  const [profileImage, setProfileImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setProfileImage(result.assets[0]);
  };

  const handleSkip = () => onCompleted();

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }
    try {
      setLoading(true);
      if (!user?.id) return;
      await api.updateUserProfile(user.id, {
        display_name: displayName,
        bio: bio || undefined,
        weight: weight ? parseInt(weight) : undefined,
        squat_pr: squatPr ? parseInt(squatPr) : undefined,
        bench_pr: benchPr ? parseInt(benchPr) : undefined,
        deadlift_pr: deadliftPr ? parseInt(deadliftPr) : undefined,
      });
      onCompleted();
    } catch (error: any) {
      Alert.alert('Setup Failed', error.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>ONE MORE STEP</Text>
            <Text style={styles.headerTitle}>Setup Profile</Text>
            <View style={styles.headerAccent} />
            <Text style={styles.subtitle}>Add your info and lifting stats</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={[styles.profileImagePlaceholder, profileImage && styles.profileImageSelected]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Text style={styles.profileImageIcon}>{profileImage ? '✅' : '📷'}</Text>
              <Text style={styles.profileImageText}>
                {profileImage ? 'Image Selected' : 'Add Profile Picture'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="How you appear to others"
                placeholderTextColor="#444"
                value={displayName}
                onChangeText={setDisplayName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>BIO</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell the community about yourself (optional)"
                placeholderTextColor="#444"
                value={bio}
                onChangeText={setBio}
                editable={!loading}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.sectionLabel}>LIFTING STATS</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>BODY WEIGHT (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 185"
                placeholderTextColor="#444"
                value={weight}
                onChangeText={setWeight}
                editable={!loading}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>SQUAT PR (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 315"
                placeholderTextColor="#444"
                value={squatPr}
                onChangeText={setSquatPr}
                editable={!loading}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>BENCH PRESS PR (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 225"
                placeholderTextColor="#444"
                value={benchPr}
                onChangeText={setBenchPr}
                editable={!loading}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>DEADLIFT PR (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 405"
                placeholderTextColor="#444"
                value={deadliftPr}
                onChangeText={setDeadliftPr}
                editable={!loading}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.skipButton, loading && styles.buttonDisabled]}
                onPress={handleSkip}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Let's Go 🏋️</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#FF4D4D',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  form: {
    gap: 14,
  },
  profileImagePlaceholder: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    gap: 8,
  },
  profileImageSelected: {
    borderColor: '#FF4D4D',
    borderStyle: 'solid',
  },
  profileImageIcon: {
    fontSize: 28,
  },
  profileImageText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4D4D',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bioInput: {
    minHeight: 90,
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: 2,
    marginTop: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  skipButtonText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    flex: 2,
    backgroundColor: '#FF4D4D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default ProfileSetupScreen;
