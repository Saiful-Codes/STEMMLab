import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  ActivityAttempt,
  PerformanceBucket,
  PerformanceEntry,
  loadAttempts,
} from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function PerformanceResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<PerformanceEntry> | null>(
    null,
  );
  const [totalSessions, setTotalSessions] = useState(0);
  const [bestSmoothness, setBestSmoothness] = useState(0);
  const [meanPeakAll, setMeanPeakAll] = useState(0);
  const [accuracyPct, setAccuracyPct] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<PerformanceEntry>(activityId);
      if (cancelled) return;

      setTotalSessions(attempts.length);
      setLatest(attempts[0] ?? null);

      if (attempts.length > 0) {
        const sessionAverages = attempts.map((a) => avg(a.entries.map((e) => e.smoothnessScore)));
        setBestSmoothness(Math.max(...sessionAverages));

        const allEntries = attempts.flatMap((a) => a.entries);
        setMeanPeakAll(avg(allEntries.map((e) => e.peakMagnitude)));

        const correctCount = allEntries.filter((e) => e.predictionCorrect).length;
        setAccuracyPct(
          allEntries.length > 0
            ? Math.round((correctCount / allEntries.length) * 100)
            : 0,
        );
      }

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

  const bucketLabel = (b: PerformanceBucket) =>
    t(`run.performance.bucket.${b}`);

  const latestAvgSmoothness = Math.round(
    avg(latest.entries.map((e) => e.smoothnessScore)),
  );
  const latestCorrectCount = latest.entries.filter(
    (e) => e.predictionCorrect,
  ).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.performance.heading')}</Text>
      <Text style={styles.meta}>
        {t('result.common.savedAt', {
          when: new Date(latest.finishedAt).toLocaleString(),
        })}
      </Text>
      <Text style={styles.meta}>
        {t('result.common.totalAttempts', { count: totalSessions })}
      </Text>

      {/* Hero card — this session's headline */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>
          {t('result.performance.thisSessionLabel')}
        </Text>
        <Text style={styles.heroValue}>
          {t('result.performance.smoothnessValue', {
            value: latestAvgSmoothness,
          })}
        </Text>
        <Text style={styles.heroSub}>
          {t('result.performance.thisSessionSub', {
            correct: latestCorrectCount,
            total: latest.entries.length,
          })}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        {t('result.performance.listHeading')}
      </Text>
      <View style={styles.list}>
        {latest.entries.map((item) => (
          <View key={item.id} style={styles.entryRow}>
            <View style={styles.entryLeft}>
              <Text style={styles.entryLabel}>
                {t('result.performance.movementLabel', { n: item.movementNumber })}
              </Text>
              <Text style={styles.entrySub}>
                {bucketLabel(item.actualBucket)}{' '}
                {item.predictionCorrect ? '✅' : '❌'}
              </Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>
                {t('result.performance.smoothnessValue', {
                  value: item.smoothnessScore,
                })}
              </Text>
              <Text style={styles.entrySub}>
                {t('result.performance.peakValue', {
                  value: item.peakMagnitude.toFixed(2),
                })}{' '}
                ·{' '}
                {t('result.performance.durationValue', {
                  seconds: (item.durationMs / 1000).toFixed(1),
                })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {t('result.performance.overallTitle')}
      </Text>
      <View style={styles.stats}>
        <Stat
          label={t('result.performance.sessions')}
          value={totalSessions.toString()}
        />
        <Stat
          label={t('result.performance.bestSmoothness')}
          value={t('result.performance.smoothnessValue', {
            value: Math.round(bestSmoothness),
          })}
        />
        <Stat
          label={t('result.performance.meanPeak')}
          value={t('result.performance.peakValue', {
            value: meanPeakAll.toFixed(2),
          })}
        />
        <Stat
          label={t('result.performance.accuracy')}
          value={`${accuracyPct}%`}
        />
      </View>

      <Pressable
        onPress={() =>
          navigation.replace('ResultSummary', {
            activityId,
            result: latestAvgSmoothness,
          })
        }
        style={({ pressed }) => [
          styles.saveBtn,
          pressed && styles.saveBtnPressed,
        ]}
      >
        <Text style={styles.saveBtnText}>{t('summary.save')}</Text>
      </Pressable>
    </ScrollView>
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

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 14, color: '#6b7280' },
  heading: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  hero: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  list: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryLeft: { flex: 1 },
  entryLabel: { fontSize: 15, color: '#111827', fontWeight: '600' },
  entryRight: { alignItems: 'flex-end' },
  entryValue: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  entrySub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnPressed: { backgroundColor: '#1d4ed8' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
