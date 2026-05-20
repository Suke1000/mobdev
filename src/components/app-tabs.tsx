import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/hooks/useAuth';


import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text, fontWeight: '700' }, color: colors.textSecondary }}>
      <NativeTabs.Trigger
        name="index"
        options={{
          title: 'Newsfeed',
          icon: {
            src: require('@/assets/images/tabIcons/home.png'),
          },
        }}
      />

      <NativeTabs.Trigger
        name="explore"
        options={{
          title: 'Explore',
          icon: {
            src: require('@/assets/images/tabIcons/explore.png'),
          },
        }}
      />

      <NativeTabs.Trigger
        name="messages"
        options={{
          title: 'Messages',
          icon: {
            src: require('@/assets/images/tabIcons/explore.png'),
          },
        }}
      />

      <NativeTabs.Trigger
        name="rankings"
        options={{
          title: 'Rankings',
          icon: {
            src: require('@/assets/images/tabIcons/explore.png'),
          },
        }}
      />

      <NativeTabs.Trigger
        name="profile"
        options={{
          title: 'Profile',
          icon: {
            src: require('@/assets/images/tabIcons/explore.png'),
          },
        }}
      />

    </NativeTabs>
  );
}


