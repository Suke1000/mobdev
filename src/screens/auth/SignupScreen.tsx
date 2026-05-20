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
import { Colors } from '../../constants/theme';
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

  // Import useAuth at the function level to avoid circular dependency
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
      Alert.alert(
        'Signup Failed',
        error.response?.data?.error || 'Failed to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  const specs: SpecializationType[] = ['SBL', 'Conventional', 'Powerlifting'];

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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the PRboard Community</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <View style={styles.specSection}>
            <Text style={styles.specLabel}>Lifting Specialization</Text>
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
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
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
  specSection: {
    marginVertical: 8,
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  specButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  specButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  specButtonSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  specText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  specTextSelected: {
    color: 'white',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: Colors.light.tabIconDefault,
  },
  linkText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default SignupScreen;
