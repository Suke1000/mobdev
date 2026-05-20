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
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/theme';
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

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleSkip = () => {
    onCompleted();
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    try {
      setLoading(true);
      if (!user?.id) return;

      // Update profile
      await api.updateUserProfile(user.id, {
        display_name: displayName,
        bio: bio || undefined,
        weight: weight ? parseInt(weight) : undefined,
        squat_pr: squatPr ? parseInt(squatPr) : undefined,
        bench_pr: benchPr ? parseInt(benchPr) : undefined,
        deadlift_pr: deadliftPr ? parseInt(deadliftPr) : undefined,
      });

      // TODO: Handle profile image upload when implemented

      onCompleted();
    } catch (error: any) {
      Alert.alert(
        'Setup Failed',
        error.response?.data?.error || 'Failed to save profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Add your info and lifting stats</Text>

        <View style={styles.form}>
          <TouchableOpacity style={styles.profileImagePlaceholder} onPress={pickImage}>
            <Text style={styles.profileImageText}>
              {profileImage ? '✓ Image Selected' : '+ Add Profile Picture'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />

          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Bio (optional)"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={bio}
            onChangeText={setBio}
            editable={!loading}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionLabel}>Lifting Stats (optional)</Text>

          <TextInput
            style={styles.input}
            placeholder="Body Weight (lbs)"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={weight}
            onChangeText={setWeight}
            editable={!loading}
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Squat PR (lbs)"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={squatPr}
            onChangeText={setSquatPr}
            editable={!loading}
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Bench Press PR (lbs)"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={benchPr}
            onChangeText={setBenchPr}
            editable={!loading}
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Deadlift PR (lbs)"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={deadliftPr}
            onChangeText={setDeadliftPr}
            editable={!loading}
            keyboardType="number-pad"
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.skipButton, loading && styles.buttonDisabled]}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Complete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  profileImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  profileImageText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.light.tabIconSelected,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bioInput: {
    minHeight: 80,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  skipButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
