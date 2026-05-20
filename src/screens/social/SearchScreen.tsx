import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/theme';
import api from '../../services/api';
import { User } from '../../types';

interface SearchScreenProps {
  onUserSelect: (user: User) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const data = await api.searchUsers(query);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.light.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchButton}>🔍</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserSearchResult
            user={item}
            onPress={() => onUserSelect(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          hasSearched ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.placeholderText}>Search for users</Text>
            </View>
          )
        }
      />
    </View>
  );
};

interface UserSearchResultProps {
  user: User;
  onPress: () => void;
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({ user, onPress }) => {
  return (
    <TouchableOpacity style={styles.userItem} onPress={onPress}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>👤</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.username}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchBox: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    fontSize: 20,
    paddingHorizontal: 8,
  },
  loader: {
    marginVertical: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  arrow: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});

export default SearchScreen;
