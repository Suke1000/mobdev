import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import AuthScreens from '@/screens/auth/AuthScreens';

import UserProfileScreen from './user-profile';
import PostCreateScreen from './new-post';
import ChatScreen from './chat';
import LogLiftsScreen from './log-lifts';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated, restoreToken } = useAuth();
  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await restoreToken();
        setAppReady(true);
      } catch (e) {
        console.warn(e);
        setAppReady(true);
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, [restoreToken]);

  if (isLoading || !appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ErrorBoundary>
        <AnimatedSplashOverlay />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="auth">
              {() => <AuthScreens onAuthComplete={() => {}} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="main" component={AppTabs} />
              <Stack.Screen
                name="user-profile"
                component={UserProfileScreen}
                options={{ presentation: 'modal', headerShown: true, headerTitle: 'Profile' }}
              />
              <Stack.Screen
                name="new-post"
                component={PostCreateScreen}
                options={{ presentation: 'modal', headerShown: true, headerTitle: 'Create Post' }}
              />
              <Stack.Screen
                name="chat"
                component={ChatScreen}
                options={{ headerShown: true, headerTitle: 'Chat' }}
              />
              <Stack.Screen
                name="log-lifts"
                component={LogLiftsScreen}
                options={{ presentation: 'modal', headerShown: true, headerTitle: 'Log Lifts' }}
              />
              <Stack.Screen
                name="settings"
                component={SettingsScreen}
                options={{ headerShown: true, headerTitle: 'Settings' }}
              />
            </>
          )}
        </Stack.Navigator>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
