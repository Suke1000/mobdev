import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import { User } from "../../types";

interface SearchScreenProps {
  onUserSelect: (user: User) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState("");
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
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PRBOARD</Text>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerAccent} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes..."
            placeholderTextColor="#444"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF4D4D" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserSearchResult user={item} onPress={() => onUserSelect(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              {hasSearched ? (
                <>
                  <Text style={styles.emptyIcon}>😕</Text>
                  <Text style={styles.emptyText}>No athletes found</Text>
                  <Text style={styles.emptySubtext}>
                    Try a different username
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>🏆</Text>
                  <Text style={styles.emptyText}>Find Athletes</Text>
                  <Text style={styles.emptySubtext}>
                    Search by username to discover lifters
                  </Text>
                </>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

interface UserSearchResultProps {
  user: User;
  onPress: () => void;
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({
  user,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.userItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.userAvatar}>
      <Text style={styles.userAvatarEmoji}>💪</Text>
    </View>
    <View style={styles.userInfo}>
      <Text style={styles.displayName}>
        {user.displayName || user.username}
      </Text>
      <Text style={styles.handle}>@{user.username}</Text>
    </View>
    <View style={styles.arrowContainer}>
      <Text style={styles.arrow}>›</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FF4D4D",
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: "#FF4D4D",
    borderRadius: 2,
    marginTop: 6,
  },
  searchWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
    marginTop: "3%",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 10,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
  clearIcon: {
    fontSize: 12,
    color: "#555",
    paddingHorizontal: 4,
  },
  searchButton: {
    backgroundColor: "#FF4D4D",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: "#FF4D4D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2A2A2A",
  },
  userAvatarEmoji: {
    fontSize: 22,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  handle: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 18,
    color: "#FF4D4D",
    fontWeight: "700",
    lineHeight: 22,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default SearchScreen;
