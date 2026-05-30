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
import { ActivityAttempt, loadAttempts, SoundEntry } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

type SoundTier = 'safe' | 'moderate' | 'harmful';

function gradeSound(peak: number): SoundTier {
  if (peak < 60) return 'safe';
  if (peak <= 85) return 'moderate';
  return 'harmful';
}

export default function SoundResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<SoundEntry> | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<SoundEntry>(activityId);
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

  const dbValues = latest.entries.map((e) => e.decibels);
  const max = Math.max(...dbValues);
  const min = Math.min(...dbValues);
  const avg = dbValues.reduce((a, b) => a + b, 0) / dbValues.length;

  const tier = gradeSound(max);
  const tierLabel =
    tier === 'safe'
      ? 'Safe levels'
      : tier === 'moderate'
      ? 'Moderate levels'
      : 'Potentially harmful';
  const tierColor =
    tier === 'safe'
      ? colors.success
      : tier === 'moderate'
      ? colors.warning
      : colors.dangerText;
  const tierBg =
    tier === 'safe'
      ? colors.successBg
      : tier === 'moderate'
      ? colors.warningBg
      : colors.dangerSoft;

  const insight =
    `Your loudest reading was ${max} dB. Sounds above 85 dB can damage ` +
    `hearing over time. Your quietest spot was ${min} dB — that's a good ` +
    `environment for concentration.`;

  const science =
    'Decibels (dB) measure sound intensity on a logarithmic scale. Every ' +
    '10 dB increase means the sound is 10 times more intense. Normal ' +
    'conversation is about 60 dB, a lawnmower is about 90 dB, and a rock ' +
    'concert can reach 120 dB.';

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
        <Text style={styles.heroLabel}>Peak level</Text>
        <Text style={styles.heroValue}>{max} dB</Text>
        <Text style={styles.heroSub}>
          {latest.entries.length} measurement
          {latest.entries.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={[styles.tierPill, { backgroundColor: tierBg }]}>
        <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.statsGrid}>
        <Stat
          styles={styles}
          label={t('result.sound.entries')}
          value={latest.entries.length.toString()}
        />
        <Stat styles={styles} label={t('result.sound.loudest')} value={`${max} dB`} />
        <Stat styles={styles} label={t('result.sound.quietest')} value={`${min} dB`} />
        <Stat
          styles={styles}
          label={t('result.sound.average')}
          value={`${avg.toFixed(1)} dB`}
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

      <Text style={styles.sectionTitle}>{t('result.sound.listHeading')}</Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryAction}>{item.action}</Text>
            <Text style={styles.entryDb}>{item.decibels} dB</Text>
          </View>
        )}
      />

      <Pressable
        onPress={() =>
          navigation.replace('ResultSummary', { activityId, result: max })
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
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryAction: { fontSize: 15 * fontScale, color: colors.text },
    entryDb: { fontSize: 15 * fontScale, fontWeight: '600', color: colors.primary },
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
