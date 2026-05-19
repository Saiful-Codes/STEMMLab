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
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  ActivityAttempt,
  BreathingEntry,
  loadAttempts,
} from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function BreathingResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<BreathingEntry> | null>(
    null
  );
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<BreathingEntry>(activityId);
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
        <Text style={styles.empty}>{t('result.common.empty')}</Text>
      </View>
    );
  }

  const rates = latest.entries.map((e) => e.breathingRate);
  const lowestRate = Math.min(...rates);
  const highestRate = Math.max(...rates);
  const meanRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const durations = latest.entries.map((e) => e.durationMs / 1000);
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  const restEntries = latest.entries.filter((e) => e.mode === 'rest');
  const exerciseEntries = latest.entries.filter((e) => e.mode === 'exercise');
  const restRate = restEntries.length > 0
    ? Math.round(restEntries.reduce((a, b) => a + b.breathingRate, 0) / restEntries.length)
    : 0;
  const exerciseRate = exerciseEntries.length > 0
    ? Math.round(exerciseEntries.reduce((a, b) => a + b.breathingRate, 0) / exerciseEntries.length)
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('result.common.latest')}</Text>
      <Text style={styles.meta}>
        {t('result.common.savedAt', {
          when: new Date(latest.finishedAt).toLocaleString(),
        })}
      </Text>
      <Text style={styles.meta}>
        {t('result.common.totalAttempts', { count: totalAttempts })}
      </Text>

      <View style={styles.stats}>
        <Stat
          label={t('result.breathing.average')}
          value={`${Math.round(meanRate)} BPM`}
        />
        <Stat
          label={t('result.breathing.lowest')}
          value={`${lowestRate} BPM`}
        />
        <Stat
          label={t('result.breathing.highest')}
          value={`${highestRate} BPM`}
        />
      </View>

      <View style={styles.comparisonBox}>
        <Text style={styles.comparisonLabel}>{t('result.breathing.comparison')}</Text>
        <View style={styles.comparisonRow}>
          <ComparisonItem label={t('run.breathing.mode.rest')} value={restRate} />
          <ComparisonItem label={t('run.breathing.mode.exercise')} value={exerciseRate} />
        </View>
      </View>

      <Text style={styles.listHeading}>
        {t('result.breathing.listHeading', { count: latest.entries.length })}
      </Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('result.breathing.empty')}</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.entryRow}>
            <View>
              <Text style={styles.entryLabel}>
                {t('result.breathing.attemptLabel', { n: item.attemptNumber })}
              </Text>
              <Text style={styles.entryMode}>
                {item.mode === 'rest'
                  ? t('run.breathing.mode.rest')
                  : t('run.breathing.mode.exercise')}
              </Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>{item.breathingRate} BPM</Text>
              <Text style={styles.entrySub}>
                {t('result.breathing.entrySub', {
                  seconds: (item.durationMs / 1000).toFixed(1),
                })}
              </Text>
            </View>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.footer}>
        <Button title={t('result.common.back')} onPress={() => navigation.popToTop()} />
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

function ComparisonItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.comparisonItem}>
      <Text style={styles.comparisonItemValue}>{value} BPM</Text>
      <Text style={styles.comparisonItemLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
  textAlign: 'center',
  marginTop: 24,
  opacity: 0.7,
},
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  stat: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  comparisonBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 16,
  },
  comparisonLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 10 },
  comparisonRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-around' },
  comparisonItem: { alignItems: 'center', flex: 1 },
  comparisonItemValue: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  comparisonItemLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  listHeading: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  list: { flex: 1 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', paddingVertical: 8 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  entryMode: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  entryRight: { alignItems: 'flex-end' },
  entryValue: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  entrySub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  footer: { marginTop: 12 },
});
