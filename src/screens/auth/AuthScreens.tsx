import React, { useState } from 'react';
import { View } from 'react-native';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import ProfileSetupScreen from './ProfileSetupScreen';
import { SpecializationType } from '../../types';

type AuthStep = 'login' | 'signup' | 'profile' | 'done';

interface AuthScreensProps {
  onAuthComplete: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [selectedSpecialization, setSelectedSpecialization] = useState<SpecializationType | null>(
    null
  );

  const handleSignupSuccess = (specialization: SpecializationType) => {
    setSelectedSpecialization(specialization);
    setStep('profile');
  };

  const handleProfileComplete = () => {
    setStep('done');
    onAuthComplete();
  };

  const handleNavigateToSignup = () => {
    setStep('signup');
  };

  const handleNavigateToLogin = () => {
    setStep('login');
  };

  return (
    <View style={{ flex: 1 }}>
      {step === 'login' && (
        <LoginScreen onSignupPress={handleNavigateToSignup} />
      )}
      {step === 'signup' && (
        <SignupScreen
          onSignupSuccess={handleSignupSuccess}
          onLoginPress={handleNavigateToLogin}
          onSignupComplete={handleProfileComplete}
        />
      )}
      {step === 'profile' && (
        <ProfileSetupScreen onCompleted={handleProfileComplete} />
      )}
    </View>
  );
};

export default AuthScreens;
