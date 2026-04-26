import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { ActivityAttempt, loadAttempts } from '../../storage/attempts';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function ActivityResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts(activityId);
      if (cancelled) return;
      setTotalAttempts(attempts.length);
      setLatest(attempts[0] ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!latest) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No attempts saved yet.</Text>
      </View>
    );
  }

  const dbValues = latest.entries.map((e) => e.decibels);
  const max = Math.max(...dbValues);
  const min = Math.min(...dbValues);
  const avg = dbValues.reduce((a, b) => a + b, 0) / dbValues.length;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Latest Attempt</Text>
      <Text style={styles.meta}>
        Saved {new Date(latest.finishedAt).toLocaleString()}
      </Text>
      <Text style={styles.meta}>Total attempts saved: {totalAttempts}</Text>

      <View style={styles.stats}>
        <Stat label="Entries" value={latest.entries.length.toString()} />
        <Stat label="Loudest" value={`${max} dB`} />
        <Stat label="Quietest" value={`${min} dB`} />
        <Stat label="Average" value={`${avg.toFixed(1)} dB`} />
      </View>

      <Text style={styles.listHeading}>Recorded sound levels</Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryAction}>{item.action}</Text>
            <Text style={styles.entryDb}>{item.decibels} dB</Text>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.actions}>
        <Button
          title="Back to Activities"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 14, color: '#6b7280' },
  heading: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  listHeading: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  list: { flex: 1 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryAction: { fontSize: 15, color: '#111827' },
  entryDb: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  actions: { marginTop: 12 },
});
