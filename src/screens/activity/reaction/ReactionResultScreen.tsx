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
import { ActivityAttempt, loadAttempts, ReactionEntry } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

type ReactionTier = 'excellent' | 'good' | 'practice';

function gradeReaction(best: number): ReactionTier {
  if (best < 250) return 'excellent';
  if (best <= 400) return 'good';
  return 'practice';
}

export default function ReactionResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<ReactionEntry> | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<ReactionEntry>(activityId);
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

  const times = latest.entries.map((e) => e.reactionMs);
  const best = Math.min(...times);
  const worst = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const avgRounded = Math.round(avg);

  const tier = gradeReaction(best);
  const tierLabel =
    tier === 'excellent'
      ? 'Excellent reflexes'
      : tier === 'good'
      ? 'Good reflexes'
      : 'Keep practicing';
  const tierColor =
    tier === 'excellent'
      ? colors.success
      : tier === 'good'
      ? colors.accent
      : colors.textMuted;
  const tierBg =
    tier === 'excellent'
      ? colors.successBg
      : tier === 'good'
      ? colors.warningBg
      : colors.surfaceMuted;

  // entries are stored oldest-first, so [0] is the first attempt.
  const firstMs = times[0];
  const lastMs = times[times.length - 1];
  const improvement = firstMs - lastMs;
  const improvementText =
    times.length > 1 && improvement > 0
      ? ` You improved by ${improvement} ms from your first to last attempt!`
      : '';

  const insight =
    `Your fastest reaction was ${best} ms and your average was ` +
    `${avgRounded} ms.${improvementText} Reaction time depends on alertness, ` +
    `practice, and the speed of nerve signals.`;

  const science =
    'Reaction time measures how quickly your nervous system responds to a ' +
    'stimulus. The signal travels from your eyes to your brain, gets ' +
    'processed, then travels to your muscles. This entire journey takes just ' +
    'a fraction of a second. Athletes train to reduce their reaction time ' +
    'through repeated practice.';

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
        <Text style={styles.heroLabel}>Best reaction</Text>
        <Text style={styles.heroValue}>{best} ms</Text>
        <Text style={styles.heroSub}>
          {latest.entries.length} attempt
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
          label={t('result.reaction.taps')}
          value={latest.entries.length.toString()}
        />
        <Stat styles={styles} label={t('result.reaction.best')} value={`${best} ms`} />
        <Stat
          styles={styles}
          label={t('result.reaction.slowest')}
          value={`${worst} ms`}
        />
        <Stat
          styles={styles}
          label={t('result.reaction.average')}
          value={`${avgRounded} ms`}
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

      <Text style={styles.sectionTitle}>{t('result.reaction.listHeading')}</Text>
      <FlatList
        data={latest.entries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>
              {t('result.reaction.attemptLabel', { n: item.attemptNumber })}
            </Text>
            <Text style={styles.entryValue}>{item.reactionMs} ms</Text>
          </View>
        )}
      />

      <Pressable
        onPress={() =>
          navigation.replace('ResultSummary', { activityId, result: best })
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
    entryLabel: { fontSize: 15 * fontScale, color: colors.text },
    entryValue: { fontSize: 15 * fontScale, fontWeight: '600', color: colors.primary },
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
