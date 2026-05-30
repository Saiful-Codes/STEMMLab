import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import { ReactionEntry, saveAttempt } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTeam } from '../../../context/TeamContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

type GameState = 'idle' | 'waiting' | 'go' | 'result' | 'tooSoon';

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

export default function ReactionRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const { team } = useTeam();
  const styles = makeStyles(colors, fontScale);

  const [isFinishing, setIsFinishing] = useState(false);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [entries, setEntries] = useState<ReactionEntry[]>([]);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);

  const goTimestampRef = useRef<number | null>(null);
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    };
  }, []);

  const handleStart = () => {
    setLastReactionMs(null);
    setGameState('waiting');
    const delay =
      MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    waitTimeoutRef.current = setTimeout(() => {
      goTimestampRef.current = Date.now();
      setGameState('go');
    }, delay);
  };

  const handleAreaPress = () => {
    if (gameState === 'waiting') {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
      goTimestampRef.current = null;
      setGameState('tooSoon');
      return;
    }

    if (gameState === 'go' && goTimestampRef.current != null) {
      const reactionMs = Date.now() - goTimestampRef.current;
      goTimestampRef.current = null;
      const newEntry: ReactionEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        attemptNumber: entries.length + 1,
        reactionMs,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setLastReactionMs(reactionMs);
      setGameState('result');
    }
  };

  const handleReset = () => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    waitTimeoutRef.current = null;
    goTimestampRef.current = null;
    setGameState('idle');
  };

  const handleFinish = async () => {
    if (entries.length === 0) {
      Alert.alert(
        t('run.reaction.alert.noAttemptsTitle'),
        t('run.reaction.alert.noAttemptsMessage')
      );
      return;
    }

    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    setIsFinishing(true);

    try {
      const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // entries state holds newest-first; persist in chronological order so
      // the result screen reads oldest-first.
      const ordered = [...entries].reverse();

      await saveAttempt<ReactionEntry>({
        id: baseId,
        activityId,
        finishedAt: Date.now(),
        entries: ordered,
      });

      navigation.replace('ActivityResult', { activityId });
    } catch (err) {
      console.error('Error finishing activity:', err);
      Alert.alert('Error', 'Failed to save activity result');
    } finally {
      setIsFinishing(false);
    }
  };

  const areaStyle = [
    styles.area,
    gameState === 'waiting' && styles.areaWaiting,
    gameState === 'go' && styles.areaGo,
    gameState === 'tooSoon' && styles.areaTooSoon,
    gameState === 'result' && styles.areaResult,
    gameState === 'idle' && styles.areaIdle,
  ];

  const reactionTimes = entries.map((e) => e.reactionMs);
  const best = reactionTimes.length ? Math.min(...reactionTimes) : null;
  const avg = reactionTimes.length
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    : null;

  const isInteractive = gameState === 'waiting' || gameState === 'go';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('run.reaction.heading')}</Text>
      <Text style={styles.subheading}>{t('run.reaction.subheading')}</Text>

      <Pressable
        onPress={handleAreaPress}
        disabled={!isInteractive}
        style={areaStyle}
      >
        {gameState === 'idle' && (
          <Text style={styles.areaText}>{t('run.reaction.area.idle')}</Text>
        )}
        {gameState === 'waiting' && (
          <Text style={styles.areaText}>{t('run.reaction.area.waiting')}</Text>
        )}
        {gameState === 'go' && (
          <Text style={styles.areaTextLarge}>{t('run.reaction.area.go')}</Text>
        )}
        {gameState === 'tooSoon' && (
          <Text style={styles.areaText}>{t('run.reaction.area.tooSoon')}</Text>
        )}
        {gameState === 'result' && lastReactionMs != null && (
          <>
            <Text style={styles.areaTextLarge}>{lastReactionMs} ms</Text>
            <Text style={styles.areaSubText}>
              {t('run.reaction.area.resultSub')}
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.controls}>
        {(gameState === 'idle' ||
          gameState === 'result' ||
          gameState === 'tooSoon') && (
          <Button
            title={
              entries.length === 0
                ? t('run.reaction.start')
                : t('run.reaction.tryAgain')
            }
            onPress={handleStart}
          />
        )}
        {gameState === 'waiting' && (
          <Button
            title={t('run.reaction.cancel')}
            onPress={handleReset}
            color={colors.danger}
          />
        )}
      </View>

      <View style={styles.statsRow}>
        <Stat
          label={t('run.reaction.stat.attempts')}
          value={entries.length.toString()}
          styles={styles}
        />
        <Stat
          label={t('run.reaction.stat.best')}
          value={best != null ? `${best} ms` : '—'}
          styles={styles}
        />
        <Stat
          label={t('run.reaction.stat.average')}
          value={avg != null ? `${Math.round(avg)} ms` : '—'}
          styles={styles}
        />
      </View>

      <Text style={styles.listHeading}>
        {t('run.reaction.attemptsHeading', { count: entries.length })}
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('run.reaction.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>
              {t('run.reaction.attemptLabel', { n: item.attemptNumber })}
            </Text>
            <Text style={styles.entryValue}>{item.reactionMs} ms</Text>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title={t('run.reaction.finish')}
          onPress={handleFinish}
          disabled={isInteractive || isFinishing}
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
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    subheading: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted, marginBottom: 12 },
    area: {
      borderRadius: 12,
      paddingVertical: 36,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      minHeight: 160,
    },
    areaIdle: { backgroundColor: colors.surfaceMuted },
    areaWaiting: { backgroundColor: colors.accent },
    areaGo: { backgroundColor: colors.success },
    areaTooSoon: { backgroundColor: colors.danger },
    areaResult: { backgroundColor: colors.primary },
    areaText: { fontSize: baseFont.bodyLg * fontScale, fontWeight: '600', color: colors.primaryText },
    areaTextLarge: { fontSize: 36 * fontScale, fontWeight: '800', color: colors.primaryText },
    areaSubText: { fontSize: baseFont.bodySm * fontScale, color: colors.primaryText, marginTop: 4, opacity: 0.9 },
    controls: { marginBottom: 12 },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    stat: {
      flexGrow: 1,
      flexBasis: 0,
      backgroundColor: colors.surfaceMuted,
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    statValue: { fontSize: baseFont.body * fontScale, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 2 },
    listHeading: { fontSize: baseFont.bodySm * fontScale, fontWeight: '600', marginBottom: 6, color: colors.text },
    list: { flex: 1 },
    emptyText: { color: colors.textSubtle, fontStyle: 'italic', paddingVertical: 8 },
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
    finishButton: { marginTop: 12 },
  });
