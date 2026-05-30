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
  EarthquakeEntry,
  loadAttempts,
} from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

type EarthquakeTier = 'excellent' | 'moderate' | 'needsWork';

function gradeEarthquake(lowestPeak: number): EarthquakeTier {
  if (lowestPeak < 0.5) return 'excellent';
  if (lowestPeak <= 1.5) return 'moderate';
  return 'needsWork';
}

export default function EarthquakeResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<EarthquakeEntry> | null>(
    null
  );
  const [totalAttempts, setTotalAttempts] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<EarthquakeEntry>(activityId);
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

  const peaks = latest.entries.map((e) => e.peakMagnitude);
  const avgs = latest.entries.map((e) => e.avgMagnitude);
  const lowestPeak = Math.min(...peaks);
  const highestPeak = Math.max(...peaks);
  const meanPeak = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  const meanAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const headlineResult = Number(lowestPeak.toFixed(2));

  const tier = gradeEarthquake(lowestPeak);
  const tierLabel =
    tier === 'excellent'
      ? 'Excellent absorption'
      : tier === 'moderate'
      ? 'Moderate absorption'
      : 'Needs improvement';
  const tierColor =
    tier === 'excellent'
      ? colors.success
      : tier === 'moderate'
      ? colors.accent
      : colors.textMuted;
  const tierBg =
    tier === 'excellent'
      ? colors.successBg
      : tier === 'moderate'
      ? colors.warningBg
      : colors.surfaceMuted;

  const count = latest.entries.length;
  const multiText =
    count > 1
      ? ` Across ${count} tests, your average peak was ${meanPeak.toFixed(2)} g.`
      : '';
  const insight =
    `Your best structure absorbed vibrations down to ` +
    `${lowestPeak.toFixed(2)} g peak movement.${multiText} Lower readings ` +
    `mean your structure absorbed more of the earthquake energy.`;

  const science =
    'Real earthquake-resistant buildings use flexible materials and base ' +
    'isolation to absorb seismic energy. The accelerometer in your phone ' +
    "measures acceleration in units of g (where 1g = Earth's gravity). A " +
    'well-designed vibration absorber converts kinetic energy into heat ' +
    'through material deformation.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('result.common.latest')}</Text>
      <Text style={styles.meta}>
        {t('result.common.savedAt', {
          when: new Date(latest.finishedAt).toLocaleString(),
        })}
      </Text>
      <Text style={styles.meta}>
        {t('result.common.totalAttempts', { count: totalAttempts })}
      </Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Best peak</Text>
        <Text style={styles.heroValue}>{lowestPeak.toFixed(2)} g</Text>
        <Text style={styles.heroSub}>
          {count} test{count === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={[styles.tierPill, { backgroundColor: tierBg }]}>
        <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.statsGrid}>
        <Stat
          styles={styles}
          label={t('result.earthquake.tests')}
          value={count.toString()}
        />
        <Stat
          styles={styles}
          label={t('result.earthquake.bestPeak')}
          value={`${lowestPeak.toFixed(2)} g`}
        />
        <Stat
          styles={styles}
          label={t('result.earthquake.worstPeak')}
          value={`${highestPeak.toFixed(2)} g`}
        />
        <Stat
          styles={styles}
          label={t('result.earthquake.meanPeak')}
          value={`${meanPeak.toFixed(2)} g`}
        />
        <Stat
          styles={styles}
          label={t('result.earthquake.meanShake')}
          value={`${meanAvg.toFixed(2)} g`}
        />
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>What does this mean?</Text>
        <Text style={styles.insightBody}>{insight}</Text>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>The science</Text>
        <Text style={styles.insightBody}>{science}</Text>
      </View>

      <Text style={styles.sectionTitle}>
        {t('result.earthquake.listHeading')}
      </Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>
              {t('result.earthquake.attemptLabel', { n: item.attemptNumber })}
            </Text>
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>
                {t('result.earthquake.entryPeak', {
                  value: item.peakMagnitude.toFixed(2),
                })}
              </Text>
              <Text style={styles.entrySub}>
                {t('result.earthquake.entrySub', {
                  seconds: (item.durationMs / 1000).toFixed(1),
                  avg: item.avgMagnitude.toFixed(2),
                })}
              </Text>
            </View>
          </View>
        )}
      />

      <Pressable
        onPress={() =>
          navigation.replace('MediaCapture', {
            activityId,
            result: headlineResult,
          })
        }
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
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
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryLabel: { fontSize: 15 * fontScale, color: colors.text },
    entryRight: { alignItems: 'flex-end' },
    entryValue: { fontSize: 15 * fontScale, fontWeight: '600', color: colors.primary },
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
