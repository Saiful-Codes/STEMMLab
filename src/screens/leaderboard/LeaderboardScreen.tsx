import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Result } from '../../types/Result';
import { getResults } from '../../storage/results';
import {
  formatResult,
  formatTimestamp,
  getActivityLabel,
  isLowerBetter,
  RANKED_ACTIVITY_IDS,
} from '../../utils/activityLabels';
import {
  averageResult,
  bestResult,
  sortResultsForRanking,
} from '../../utils/resultUtils';

const FILTERS = RANKED_ACTIVITY_IDS.map((id) => ({
  id,
  label: getActivityLabel(id).split(' ')[0],
}));

export default function LeaderboardScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [activityId, setActivityId] = useState<string>(RANKED_ACTIVITY_IDS[0]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        const stored = await getResults();
        if (!cancelled) {
          setResults(stored);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const forActivity = results.filter((r) => r.activityId === activityId);
  const ranked = sortResultsForRanking(forActivity, activityId);
  const total = forActivity.length;
  const best = bestResult(forActivity, activityId);
  const avg = averageResult(forActivity, activityId);
  const lower = isLowerBetter(activityId);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Leaderboard</Text>
      <Text style={styles.subheading}>
        {lower ? 'Lower is better' : 'Higher is better'}
      </Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setActivityId(f.id)}
            style={[styles.chip, activityId === f.id && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activityId === f.id && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Attempts" value={loading ? '…' : String(total)} />
        <StatCard
          label="Best"
          value={best === null ? '—' : formatResult(activityId, best)}
        />
        <StatCard
          label="Average"
          value={avg === null ? '—' : formatResult(activityId, avg)}
        />
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : ranked.length === 0 ? (
        <Text style={styles.empty}>No leaderboard data yet</Text>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={[styles.rank, index < 3 && styles.rankTop]}>
                {index + 1}
              </Text>
              <View style={styles.rowMain}>
                <Text style={styles.team}>{item.teamName}</Text>
                <Text style={styles.rowMeta}>
                  {getActivityLabel(item.activityId)} ·{' '}
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              <Text style={styles.rowResult}>
                {formatResult(item.activityId, item.result)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
  },
  statLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    width: 28,
    color: '#9ca3af',
  },
  rankTop: { color: '#f59e0b' },
  rowMain: { flex: 1, paddingHorizontal: 8 },
  team: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowResult: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
    fontSize: 14,
  },
});
