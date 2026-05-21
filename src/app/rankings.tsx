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
  const isTop3 = entry.rank <= 3;

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#555';
  };

  return (
    <View style={[styles.rankingItem, isTop3 && styles.rankingItemTop]}>
      {isTop3 && <View style={[styles.topAccentBar, { backgroundColor: getRankColor(entry.rank) }]} />}
      
      <View style={styles.rankBadge}>
        {getMedalEmoji(entry.rank) ? (
          <Text style={styles.medalEmoji}>{getMedalEmoji(entry.rank)}</Text>
        ) : (
          <Text style={[styles.rankNumber, { color: getRankColor(entry.rank) }]}>
            {entry.rank}
          </Text>
        )}
      </View>

      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>💪</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{entry.user.username}</Text>
        {isTop3 && <Text style={styles.topLabel}>Top Lifter</Text>}
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isTop3 && { color: getRankColor(entry.rank) }]}>
          {entry.score.toFixed(2)}
        </Text>
        <Text style={styles.scoreLabel}>pts</Text>
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
      if (isAuthenticated) fetchRankings();
    }, [isAuthenticated, fetchRankings])
  );

  if (loading && rankings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PRBOARD</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.headerAccent} />
      </View>

      {/* Community Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {communities.map((community, index) => (
            <TouchableOpacity
              key={community.id}
              style={[styles.tab, selectedCommunity === index && styles.tabActive]}
              onPress={() => setSelectedCommunity(index)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedCommunity === index && styles.tabTextActive]}>
                {community.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Column Labels */}
      <View style={styles.columnLabels}>
        <Text style={styles.columnLabel}>RANK</Text>
        <Text style={[styles.columnLabel, { flex: 1, marginLeft: 68 }]}>ATHLETE</Text>
        <Text style={styles.columnLabel}>SCORE</Text>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => <RankingItem entry={item} index={index} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏆</Text>
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
    backgroundColor: '#0F0F0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#FF4D4D',
    borderRadius: 2,
    marginTop: 6,
  },
  tabsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabActive: {
    backgroundColor: '#FF4D4D',
    borderColor: '#FF4D4D',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  columnLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 4,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
    gap: 12,
  },
  rankingItemTop: {
    borderColor: '#2A2A2A',
    backgroundColor: '#161616',
  },
  topAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 26,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  topLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF4D4D',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4D4D',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 1,
    marginTop: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
  },
});
