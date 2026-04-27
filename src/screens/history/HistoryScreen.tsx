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
  RANKED_ACTIVITY_IDS,
} from '../../utils/activityLabels';

type Filter = 'all' | string;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...RANKED_ACTIVITY_IDS.map((id) => ({ id, label: getActivityLabel(id).split(' ')[0] })),
];

export default function HistoryScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
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

  const filtered =
    filter === 'all' ? results : results.filter((r) => r.activityId === filter);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>History</Text>
      <Text style={styles.subheading}>All saved attempts across activities.</Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.chip, filter === f.id && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, filter === f.id && styles.chipTextActive]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>
          {results.length === 0
            ? 'No results saved yet'
            : 'No attempts for this activity yet'}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.activityName}>
                  {getActivityLabel(item.activityId)}
                </Text>
                <Text style={styles.resultValue}>
                  {formatResult(item.activityId, item.result)}
                </Text>
              </View>
              <Text style={styles.meta}>
                {item.teamName} · {formatTimestamp(item.timestamp)}
              </Text>
              {item.rating ? (
                <Text style={styles.rating}>
                  {'★'.repeat(item.rating)}
                  <Text style={styles.ratingDim}>
                    {'★'.repeat(5 - item.rating)}
                  </Text>
                </Text>
              ) : null}
              {item.comment ? (
                <Text style={styles.comment}>“{item.comment}”</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 24, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
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
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 8 },
  resultValue: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  meta: { fontSize: 12, color: '#6b7280' },
  rating: { fontSize: 14, color: '#f59e0b', marginTop: 6 },
  ratingDim: { color: '#d1d5db' },
  comment: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginTop: 6 },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
    fontSize: 14,
  },
});
