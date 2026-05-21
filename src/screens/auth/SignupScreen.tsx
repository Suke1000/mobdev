import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpecializationType } from '../../types';

interface SignupScreenProps {
  onSignupSuccess: (specialization: SpecializationType) => void;
  onLoginPress: () => void;
  onSignupComplete: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onLoginPress,
  onSignupComplete,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<SpecializationType | null>(null);
  const [loading, setLoading] = useState(false);

  const { signup } = require('../../hooks/useAuth').useAuth();

  const handleSignup = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!selectedSpec) {
      Alert.alert('Error', 'Please select your lifting specialization');
      return;
    }
    try {
      setLoading(true);
      await signup(email, password, username, selectedSpec);
      onSignupSuccess(selectedSpec);
      onSignupComplete();
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const specs: SpecializationType[] = ['SBL', 'Conventional', 'Powerlifting'];

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
            <Text style={styles.headerEyebrow}>GET STARTED</Text>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.headerAccent} />
            <Text style={styles.subtitle}>Join the PRboard Community</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#444"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#444"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor="#444"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor="#444"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.specSection}>
              <Text style={styles.inputLabel}>LIFTING SPECIALIZATION</Text>
              <View style={styles.specButtons}>
                {specs.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.specButton,
                      selectedSpec === spec && styles.specButtonSelected,
                    ]}
                    onPress={() => setSelectedSpec(spec)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.specText,
                        selectedSpec === spec && styles.specTextSelected,
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign Up 🚀</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onLoginPress}>
                <Text style={styles.linkText}>Login</Text>
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
    gap: 16,
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
  specSection: {
    gap: 10,
  },
  specButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  specButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  specButtonSelected: {
    borderColor: '#FF4D4D',
    backgroundColor: '#FF4D4D',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  specText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  specTextSelected: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: {
    color: '#555',
    fontSize: 14,
  },
  linkText: {
    color: '#FF4D4D',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default SignupScreen;
