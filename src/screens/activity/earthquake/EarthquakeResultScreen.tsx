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
  EarthquakeEntry,
  loadAttempts,
} from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

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

  const peaks = latest.entries.map((e) => e.peakMagnitude);
  const avgs = latest.entries.map((e) => e.avgMagnitude);
  const lowestPeak = Math.min(...peaks);
  const highestPeak = Math.max(...peaks);
  const meanPeak = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  const meanAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;

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
          label={t('result.earthquake.tests')}
          value={latest.entries.length.toString()}
          styles={styles}
        />
        <Stat
          label={t('result.earthquake.bestPeak')}
          value={`${lowestPeak.toFixed(2)} g`}
          styles={styles}
        />
        <Stat
          label={t('result.earthquake.worstPeak')}
          value={`${highestPeak.toFixed(2)} g`}
          styles={styles}
        />
        <Stat
          label={t('result.earthquake.meanPeak')}
          value={`${meanPeak.toFixed(2)} g`}
          styles={styles}
        />
        <Stat
          label={t('result.earthquake.meanShake')}
          value={`${meanAvg.toFixed(2)} g`}
          styles={styles}
        />
      </View>

      <Text style={styles.listHeading}>
        {t('result.earthquake.listHeading')}
      </Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
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
        style={styles.list}
      />

      <View style={styles.actions}>
        <Button
          title={t('result.common.back')}
          onPress={() => navigation.popToTop()}
        />
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Stat({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: Styles;
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
    container: { flex: 1, padding: 16, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    empty: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted },
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    meta: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 2 },
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
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    statValue: { fontSize: baseFont.bodyLg * fontScale, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 2 },
    listHeading: { fontSize: baseFont.bodySm * fontScale, fontWeight: '600', marginBottom: 6, color: colors.text },
    list: { flex: 1 },
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
    entrySub: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 2 },
    actions: { marginTop: 12 },
  });
