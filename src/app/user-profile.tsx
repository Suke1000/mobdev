import { useRoute } from '@react-navigation/native';
import ProfileScreen from '../screens/social/ProfileScreen';
import { useAuth } from '../hooks/useAuth';

type UserProfileRouteParams = {
  userId: string;
};

export default function UserProfileScreen() {
  const { logout } = useAuth();
  const route = useRoute();
  const params = route.params as UserProfileRouteParams | undefined;

  // Extract userId from route params
  const userId = params?.userId;

  console.log('user-profile route params:', params, 'resolved userId:', userId);

  return (
    <ProfileScreen
      key={userId ? `profile-${userId}` : 'my-profile'}
      onLogout={async () => {
        await logout();
      }}
      userId={userId}
    />
  );
}
