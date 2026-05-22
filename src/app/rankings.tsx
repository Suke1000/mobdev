import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { RankingEntry } from '../types';

interface AthleteModalProps {
  entry: RankingEntry | null;
  visible: boolean;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

const AthleteModal: React.FC<AthleteModalProps> = ({ entry, visible, onClose, onViewProfile }) => {
  if (!entry) return null;

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />

          <View style={modalStyles.athleteHeader}>
            <View style={modalStyles.avatar}>
              <Text style={modalStyles.avatarEmoji}>💪</Text>
            </View>
            <Text style={modalStyles.medal}>{getMedal(entry.rank)}</Text>
            <Text style={modalStyles.username}>@{entry.user.username}</Text>
            <View style={modalStyles.scorePill}>
              <Text style={modalStyles.scoreLabel}>STRENGTH SCORE</Text>
              <Text style={modalStyles.scoreValue}>{entry.score.toFixed(2)}</Text>
            </View>
          </View>

          {entry.stats && (
            <View style={modalStyles.statsCard}>
              <Text style={modalStyles.statsEyebrow}>PERSONAL RECORDS</Text>
              {entry.stats.weight ? (
                <View style={modalStyles.statRow}>
                  <View style={modalStyles.statLeft}><Text style={modalStyles.statIcon}>⚖️</Text><Text style={modalStyles.statLabel}>Body Weight</Text></View>
                  <Text style={modalStyles.statValue}>{entry.stats.weight} <Text style={modalStyles.statUnit}>lbs</Text></Text>
                </View>
              ) : null}
              {entry.stats.squatPr ? (
                <View style={modalStyles.statRow}>
                  <View style={modalStyles.statLeft}><Text style={modalStyles.statIcon}>🦵</Text><Text style={modalStyles.statLabel}>Squat PR</Text></View>
                  <Text style={modalStyles.statValue}>{entry.stats.squatPr} <Text style={modalStyles.statUnit}>lbs</Text></Text>
                </View>
              ) : null}
              {entry.stats.benchPr ? (
                <View style={modalStyles.statRow}>
                  <View style={modalStyles.statLeft}><Text style={modalStyles.statIcon}>💪</Text><Text style={modalStyles.statLabel}>Bench PR</Text></View>
                  <Text style={modalStyles.statValue}>{entry.stats.benchPr} <Text style={modalStyles.statUnit}>lbs</Text></Text>
                </View>
              ) : null}
              {entry.stats.deadliftPr ? (
                <View style={[modalStyles.statRow, { borderBottomWidth: 0 }]}>
                  <View style={modalStyles.statLeft}><Text style={modalStyles.statIcon}>🏋️</Text><Text style={modalStyles.statLabel}>Deadlift PR</Text></View>
                  <Text style={modalStyles.statValue}>{entry.stats.deadliftPr} <Text style={modalStyles.statUnit}>lbs</Text></Text>
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={modalStyles.profileBtn}
            onPress={() => { onClose(); onViewProfile(entry.userId); }}
            activeOpacity={0.85}
          >
            <Text style={modalStyles.profileBtnText}>View Full Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Text style={modalStyles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface RankingItemProps {
  entry: RankingEntry;
  isCurrentUser: boolean;
  onPress: () => void;
}

const RankingItem: React.FC<RankingItemProps> = ({ entry, isCurrentUser, onPress }) => {
  const isTop3 = entry.rank <= 3;

  const getMedal = (rank: number) => {
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
    <TouchableOpacity
      style={[styles.row, isTop3 && styles.rowTop, isCurrentUser && styles.rowMe]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isTop3 && <View style={[styles.accentBar, { backgroundColor: getRankColor(entry.rank) }]} />}

      <View style={styles.rankBadge}>
        {getMedal(entry.rank) ? (
          <Text style={styles.medal}>{getMedal(entry.rank)}</Text>
        ) : (
          <Text style={[styles.rankNum, { color: getRankColor(entry.rank) }]}>{entry.rank}</Text>
        )}
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>💪</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.username}>
          {entry.user.username}
          {isCurrentUser ? '  ' : ''}
          {isCurrentUser && <Text style={styles.youTag}>YOU</Text>}
        </Text>
        {isTop3 && <Text style={styles.topLabel}>Top Lifter</Text>}
      </View>

      <View style={styles.scoreBox}>
        <Text style={[styles.score, isTop3 && { color: getRankColor(entry.rank) }]}>
          {entry.score.toFixed(2)}
        </Text>
        <Text style={styles.scorePts}>pts</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getRankings();
      setRankings(data);
    } catch (error) {
      console.error('Rankings fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchRankings();
    }, [isAuthenticated, fetchRankings])
  );

  const handlePressEntry = (entry: RankingEntry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  const handleViewProfile = (userId: string) => {
    // @ts-ignore
    navigation.navigate('user-profile', { userId });
  };

  if (loading && rankings.length === 0) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>PRBOARD</Text>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.accent} />
        </View>
        <TouchableOpacity
          style={styles.logBtn}
          // @ts-ignore
          onPress={() => navigation.navigate('log-lifts')}
          activeOpacity={0.85}
        >
          <Text style={styles.logBtnIcon}>🏋️</Text>
          <Text style={styles.logBtnText}>Log Lifts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.colHeaders}>
        <Text style={styles.colLabel}>RANK</Text>
        <Text style={[styles.colLabel, { flex: 1, marginLeft: 68 }]}>ATHLETE</Text>
        <Text style={styles.colLabel}>SCORE</Text>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(item) => item.userId}
        refreshing={loading}
        onRefresh={fetchRankings}
        renderItem={({ item }) => (
          <RankingItem
            entry={item}
            isCurrentUser={item.userId === user?.id}
            onPress={() => handlePressEntry(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptySub}>Be the first to log your lifts!</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              // @ts-ignore
              onPress={() => navigation.navigate('log-lifts')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Log Your Lifts</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AthleteModal
        entry={selectedEntry}
        visible={showModal}
        onClose={() => setShowModal(false)}
        onViewProfile={handleViewProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2.5, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  accent: { width: 40, height: 3, backgroundColor: '#FF4D4D', borderRadius: 2, marginTop: 6 },
  logBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4D4D', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 6, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  logBtnIcon: { fontSize: 14 },
  logBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  colHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1A1A1A', marginBottom: 4 },
  colLabel: { fontSize: 10, fontWeight: '700', color: '#333', letterSpacing: 1.5 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, marginBottom: 8, padding: 14, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden', gap: 12 },
  rowTop: { backgroundColor: '#161616' },
  rowMe: { borderColor: '#FF4D4D', backgroundColor: '#FF4D4D11' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  rankBadge: { width: 36, alignItems: 'center' },
  medal: { fontSize: 26 },
  rankNum: { fontSize: 18, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  avatarEmoji: { fontSize: 20 },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  youTag: { fontSize: 10, fontWeight: '800', color: '#FF4D4D', backgroundColor: '#FF4D4D22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  topLabel: { fontSize: 11, fontWeight: '600', color: '#FF4D4D', letterSpacing: 0.5 },
  scoreBox: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '800', color: '#FF4D4D', letterSpacing: -0.5 },
  scorePts: { fontSize: 10, fontWeight: '600', color: '#333', letterSpacing: 1, marginTop: 1 },
  chevron: { fontSize: 20, color: '#333', fontWeight: '700' },
  empty: { justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#555', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#FF4D4D', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderTopWidth: 1, borderColor: '#2A2A2A' },
  handle: { width: 40, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  athleteHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FF4D4D44', marginBottom: 12 },
  avatarEmoji: { fontSize: 32 },
  medal: { fontSize: 28, marginBottom: 6 },
  username: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  scorePill: { backgroundColor: '#FF4D4D22', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FF4D4D44' },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 2, marginBottom: 4 },
  scoreValue: { fontSize: 28, fontWeight: '900', color: '#FF4D4D', letterSpacing: -1 },
  statsCard: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  statsEyebrow: { fontSize: 10, fontWeight: '700', color: '#FF4D4D', letterSpacing: 2, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { fontSize: 16 },
  statLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  statUnit: { fontSize: 11, fontWeight: '500', color: '#555' },
  profileBtn: { backgroundColor: '#FF4D4D', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  profileBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  closeBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  closeBtnText: { color: '#555', fontSize: 15, fontWeight: '700' },
});
