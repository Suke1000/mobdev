import React, { useState } from 'react';
import { View } from 'react-native';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

type AuthStep = 'login' | 'signup';

interface AuthScreensProps {
  onAuthComplete: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<AuthStep>('login');

  return (
    <View style={{ flex: 1 }}>
      {step === 'login' && (
        <LoginScreen onSignupPress={() => setStep('signup')} />
      )}
      {step === 'signup' && (
        <SignupScreen
          onSignupSuccess={() => {}}
          onLoginPress={() => setStep('login')}
          onSignupComplete={onAuthComplete}
        />
      )}
    </View>
  );
};

export default AuthScreens;
