import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { RankingEntry } from '../types';

const communities = [
  { id: 'sbl-community', name: 'SBL' },
  { id: 'conventional-community', name: 'Conventional' },
  { id: 'powerlifting-community', name: 'Powerlifting' },
];

interface RankingItemProps {
  entry: RankingEntry;
  index: number;
}

const RankingItem: React.FC<RankingItemProps> = ({ entry, index }) => {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <View style={styles.rankingItem}>
      <View style={styles.rankPosition}>
        <Text style={styles.rankMedal}>{getMedalEmoji(entry.rank)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{entry.user.username}</Text>
      </View>
      <View style={styles.scoreSection}>
        <Text style={styles.score}>{entry.score.toFixed(2)}</Text>
        <Text style={styles.scoreLabel}>score</Text>
      </View>
    </View>
  );
};

export default function RankingsScreen() {
  const [selectedCommunity, setSelectedCommunity] = useState(0);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      const communityId = communities[selectedCommunity].id;
      const data = await api.getRankings(communityId);
      setRankings(data);
    } catch (error) {
      console.error('Rankings fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCommunity]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchRankings();
      }
    }, [isAuthenticated, fetchRankings])
  );

  if (loading && rankings.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <View style={styles.communitySelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.communityTabs}
        >
          {communities.map((community, index) => (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityTab,
                selectedCommunity === index && styles.communityTabActive,
              ]}
              onPress={() => setSelectedCommunity(index)}
            >
              <Text
                style={[
                  styles.communityTabText,
                  selectedCommunity === index && styles.communityTabTextActive,
                ]}
              >
                {community.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => <RankingItem entry={item} index={index} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rankings yet</Text>
            <Text style={styles.emptySubtext}>Be the first to set your PRs!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  communitySelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  communityTabs: {
    flexDirection: 'row',
  },
  communityTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSelected,
  },
  communityTabActive: {
    backgroundColor: '#FF6B6B',
  },
  communityTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  communityTabTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  rankPosition: {
    width: 40,
    alignItems: 'center',
  },
  rankMedal: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
