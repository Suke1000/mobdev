import { View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import ProfileScreen from '../screens/social/ProfileScreen';

/**
 * This is the user's own profile tab.
 * It should ALWAYS show the current user's profile, never other users' profiles.
 * Other users' profiles are shown via the user-profile modal route.
 */
export default function MyProfileScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Always show current user's profile (userId is undefined = own profile)
  return (
    <ProfileScreen
      key="my-profile"
      onLogout={handleLogout}
      userId={undefined}
    />
  );
}
