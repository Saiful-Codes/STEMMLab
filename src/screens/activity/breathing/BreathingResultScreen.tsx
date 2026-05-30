import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  BreathingEntry,
  loadAttempts,
} from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

type Summary = {
  count: number;
  restCount: number;
  exerciseCount: number;
  avgRest: number | null;
  avgExercise: number | null;
  difference: number | null;
  highest: number;
  lowest: number;
  totalDurationSec: number;
};

type PerformanceTier = 'good' | 'needsData' | 'tryLonger';

function summarise(entries: BreathingEntry[]): Summary {
  const rates = entries.map((e) => e.breathingRate);
  const rest = entries.filter((e) => e.mode === 'rest');
  const exercise = entries.filter((e) => e.mode === 'exercise');
  const avgRest = rest.length
    ? Math.round(rest.reduce((s, e) => s + e.breathingRate, 0) / rest.length)
    : null;
  const avgExercise = exercise.length
    ? Math.round(
        exercise.reduce((s, e) => s + e.breathingRate, 0) / exercise.length
      )
    : null;
  return {
    count: entries.length,
    restCount: rest.length,
    exerciseCount: exercise.length,
    avgRest,
    avgExercise,
    difference:
      avgRest != null && avgExercise != null ? avgExercise - avgRest : null,
    highest: Math.max(...rates),
    lowest: Math.min(...rates),
    totalDurationSec: entries.reduce((s, e) => s + e.durationMs / 1000, 0),
  };
}

function gradePerformance(summary: Summary): PerformanceTier {
  if (summary.avgRest == null || summary.avgExercise == null) {
    return 'needsData';
  }
  if (summary.difference != null && Math.abs(summary.difference) < 3) {
    return 'tryLonger';
  }
  return 'good';
}

export default function BreathingResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);

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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!latest || latest.entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('result.common.empty')}</Text>
      </View>
    );
  }

  const summary = summarise(latest.entries);
  const tier = gradePerformance(summary);

  const insightKey =
    tier === 'needsData'
      ? 'result.breathing.insight.needsData'
      : tier === 'tryLonger'
      ? 'result.breathing.insight.tryLonger'
      : (summary.difference ?? 0) > 0
      ? 'result.breathing.insight.exerciseHigher'
      : 'result.breathing.insight.restHigher';

  const performanceKey =
    tier === 'good'
      ? 'result.breathing.performance.good'
      : tier === 'tryLonger'
      ? 'result.breathing.performance.tryLonger'
      : 'result.breathing.performance.needsData';

  const performanceColor =
    tier === 'good'
      ? colors.success
      : tier === 'tryLonger'
      ? colors.accent
      : colors.textMuted;
  const performanceBg =
    tier === 'good'
      ? colors.successBg
      : tier === 'tryLonger'
      ? colors.warningBg
      : colors.surfaceMuted;

  // Average across all measurements is what we save to the leaderboard / history.
  const overallAvg = Math.round(
    latest.entries.reduce((s, e) => s + e.breathingRate, 0) /
      latest.entries.length
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.breathing.heading')}</Text>
      <Text style={styles.meta}>
        {t('result.common.savedAt', {
          when: new Date(latest.finishedAt).toLocaleString(),
        })}
      </Text>
      <Text style={styles.meta}>
        {t('result.common.totalAttempts', { count: totalAttempts })}
      </Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{t('result.breathing.average')}</Text>
        <Text style={styles.heroValue}>{overallAvg} BPM</Text>
        <Text style={styles.heroSub}>
          {t('result.breathing.measurementCount', { count: summary.count })}
        </Text>
      </View>

      <View
        style={[styles.tierPill, { backgroundColor: performanceBg }]}
      >
        <Text style={[styles.tierText, { color: performanceColor }]}>
          {t(performanceKey)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        {t('result.breathing.summaryTitle')}
      </Text>
      <View style={styles.statsGrid}>
        <Stat
          styles={styles}
          label={t('result.breathing.summary.measurements')}
          value={summary.count.toString()}
        />
        <Stat
          styles={styles}
          label={t('result.breathing.summary.avgRest')}
          value={summary.avgRest != null ? `${summary.avgRest} BPM` : '—'}
        />
        <Stat
          styles={styles}
          label={t('result.breathing.summary.avgExercise')}
          value={
            summary.avgExercise != null ? `${summary.avgExercise} BPM` : '—'
          }
        />
        <Stat
          styles={styles}
          label={t('result.breathing.summary.difference')}
          value={
            summary.difference != null
              ? `${summary.difference >= 0 ? '+' : ''}${summary.difference} BPM`
              : '—'
          }
        />
        <Stat
          styles={styles}
          label={t('result.breathing.highest')}
          value={`${summary.highest} BPM`}
        />
        <Stat
          styles={styles}
          label={t('result.breathing.lowest')}
          value={`${summary.lowest} BPM`}
        />
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>
          {t('result.breathing.insightTitle')}
        </Text>
        <Text style={styles.insightBody}>{t(insightKey)}</Text>
      </View>

      <Text style={styles.sectionTitle}>
        {t('result.breathing.listHeading', { count: latest.entries.length })}
      </Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyRowText}>
            {t('result.breathing.empty')}
          </Text>
        }
        renderItem={({ item }) => (
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
      />

      <Pressable
        onPress={() =>
          navigation.replace('ResultSummary', {
            activityId,
            result: overallAvg,
          })
        }
        style={({ pressed }) => [
          styles.saveBtn,
          {
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          },
        ]}
      >
        <Text style={styles.saveBtnText}>{t('summary.save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Stat({
  styles,
  label,
  value,
}: {
  styles: Styles;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors, fontScale: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    empty: {
      fontSize: baseFont.bodySm * fontScale,
      color: colors.textMuted,
      textAlign: 'center',
    },
    heading: {
      fontSize: baseFont.subheading * fontScale,
      fontWeight: '700',
      color: colors.text,
    },
    meta: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 2,
    },
    hero: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      marginBottom: 12,
    },
    heroLabel: {
      fontSize: baseFont.micro * fontScale,
      color: 'rgba(255,255,255,0.85)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroValue: {
      fontSize: baseFont.display * fontScale,
      fontWeight: '800',
      color: '#fff',
      marginTop: 4,
    },
    heroSub: {
      fontSize: baseFont.tiny * fontScale,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 4,
    },
    tierPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    tierText: {
      fontSize: baseFont.small * fontScale,
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    stat: {
      flexGrow: 1,
      flexBasis: '45%',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: baseFont.body * fontScale,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    insightCard: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 16,
    },
    insightTitle: {
      fontSize: baseFont.small * fontScale,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    insightBody: {
      fontSize: baseFont.bodySm * fontScale,
      color: colors.textMuted,
      lineHeight: 20,
    },
    emptyRowText: {
      color: colors.textSubtle,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryLabel: {
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '600',
      color: colors.text,
    },
    entryMode: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 2,
    },
    entryRight: { alignItems: 'flex-end' },
    entryValue: {
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
      color: colors.primary,
    },
    entrySub: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 2,
    },
    saveBtn: {
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    saveBtnText: {
      color: '#fff',
      fontSize: baseFont.body * fontScale,
      fontWeight: '700',
    },
  });
