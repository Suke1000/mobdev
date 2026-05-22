import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function LogLiftsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [squatPr, setSquatPr] = useState('');
  const [benchPr, setBenchPr] = useState('');
  const [deadliftPr, setDeadliftPr] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) { setFetching(false); return; }
      try {
        const profile = await api.getUserProfile(user.id);
        if (profile.stats) {
          if (profile.stats.weight) setWeight(String(profile.stats.weight));
          if (profile.stats.squatPr) setSquatPr(String(profile.stats.squatPr));
          if (profile.stats.benchPr) setBenchPr(String(profile.stats.benchPr));
          if (profile.stats.deadliftPr) setDeadliftPr(String(profile.stats.deadliftPr));
        }
      } catch (e) {
        console.error('Load stats error:', e);
      } finally {
        setFetching(false);
      }
    };
    loadStats();
  }, [user?.id]);

  const total = (parseInt(squatPr) || 0) + (parseInt(benchPr) || 0) + (parseInt(deadliftPr) || 0);
  const bodyweight = parseInt(weight) || 0;
  const previewScore = bodyweight > 0 ? ((total / bodyweight) * 100).toFixed(2) : '—';

  const handleSave = async () => {
    if (!user?.id) return;

    if (!weight.trim()) {
      Alert.alert('Missing Info', 'Please enter your body weight');
      return;
    }
    if (!squatPr.trim() && !benchPr.trim() && !deadliftPr.trim()) {
      Alert.alert('Missing Info', 'Please enter at least one PR');
      return;
    }

    try {
      setLoading(true);

      await api.updateUserProfile(user.id, {
        weight: parseInt(weight),
        squat_pr: squatPr ? parseInt(squatPr) : undefined,
        bench_pr: benchPr ? parseInt(benchPr) : undefined,
        deadlift_pr: deadliftPr ? parseInt(deadliftPr) : undefined,
      });

      Alert.alert(
        '🏆 Lifts Logged!',
        `Your strength score is ${previewScore}. Check the leaderboard!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to save lifts');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>PRBOARD</Text>
          <Text style={styles.headerTitle}>Log Your Lifts</Text>
          <View style={styles.headerAccent} />
          <Text style={styles.headerSubtitle}>Update your PRs to climb the leaderboard</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>STRENGTH SCORE PREVIEW</Text>
          <Text style={styles.scoreValue}>{previewScore}</Text>
          <Text style={styles.scoreFormula}>
            (Squat + Bench + Deadlift) ÷ Bodyweight × 100
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>⚖️  BODY WEIGHT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#444"
              value={weight}
              onChangeText={setWeight}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.unit}>lbs</Text>
          </View>
        </View>

        <Text style={styles.sectionDivider}>YOUR LIFTS</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>🦵  SQUAT PR</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#444"
              value={squatPr}
              onChangeText={setSquatPr}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.unit}>lbs</Text>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>💪  BENCH PRESS PR</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#444"
              value={benchPr}
              onChangeText={setBenchPr}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.unit}>lbs</Text>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>🏋️  DEADLIFT PR</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#444"
              value={deadliftPr}
              onChangeText={setDeadliftPr}
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.unit}>lbs</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{total} <Text style={styles.totalUnit}>lbs</Text></Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.cancelBtn, loading && styles.btnDisabled]}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save & Rank 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  loadingContainer: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 18 },
  header: { marginBottom: 4 },
  headerEyebrow: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerAccent: { width: 40, height: 3, backgroundColor: '#FF4D4D', borderRadius: 2, marginTop: 6, marginBottom: 12 },
  headerSubtitle: { fontSize: 14, color: '#777' },
  scoreCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FF4D4D44' },
  scoreLabel: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2, marginBottom: 8 },
  scoreValue: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, marginBottom: 6 },
  scoreFormula: { fontSize: 11, color: '#555', fontWeight: '500', textAlign: 'center' },
  sectionDivider: { fontSize: 11, fontWeight: '700', color: '#444', letterSpacing: 2, marginTop: 4 },
  inputWrapper: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#FF4D4D', letterSpacing: 1.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 16 },
  input: { flex: 1, paddingVertical: 14, fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  unit: { fontSize: 13, fontWeight: '700', color: '#555', letterSpacing: 1 },
  totalCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  totalLabel: { fontSize: 11, fontWeight: '800', color: '#777', letterSpacing: 2 },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#FF4D4D' },
  totalUnit: { fontSize: 12, fontWeight: '500', color: '#555' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  cancelBtnText: { color: '#555', fontSize: 15, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#FF4D4D', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  btnDisabled: { opacity: 0.5 },
});
