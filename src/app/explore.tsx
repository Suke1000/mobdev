import SearchScreen from '../screens/social/SearchScreen';
import { useNavigation } from '@react-navigation/native';
import { User } from '../types';

export default function ExploreScreen() {
  const navigation = useNavigation();

  const handleUserSelect = (user: User) => {
    // Navigate to user-profile modal using React Navigation
    // @ts-ignore - navigate with params
    navigation.navigate('user-profile', { userId: user.id });
  };

  return <SearchScreen onUserSelect={handleUserSelect} />;
}
