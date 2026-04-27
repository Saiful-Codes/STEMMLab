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
import { ReactionEntry } from '../../../storage/attempts';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

type GameState = 'idle' | 'waiting' | 'go' | 'result' | 'tooSoon';

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

export default function ReactionRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;

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

  const handleFinish = () => {
    if (entries.length === 0) {
      Alert.alert('No attempts', 'Try at least one tap before finishing.');
      return;
    }
    const bestMs = Math.min(...entries.map((e) => e.reactionMs));
    navigation.replace('ResultSummary', {
      activityId,
      result: bestMs,
    });
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
      <Text style={styles.heading}>Reaction Board – Tap Phase</Text>
      <Text style={styles.subheading}>
        Tap Start, wait for the green signal, then tap as fast as you can.
      </Text>

      <Pressable
        onPress={handleAreaPress}
        disabled={!isInteractive}
        style={areaStyle}
      >
        {gameState === 'idle' && (
          <Text style={styles.areaText}>Press Start to begin</Text>
        )}
        {gameState === 'waiting' && (
          <Text style={styles.areaText}>Wait for green…</Text>
        )}
        {gameState === 'go' && (
          <Text style={styles.areaTextLarge}>TAP NOW!</Text>
        )}
        {gameState === 'tooSoon' && (
          <Text style={styles.areaText}>Too soon! Try again.</Text>
        )}
        {gameState === 'result' && lastReactionMs != null && (
          <>
            <Text style={styles.areaTextLarge}>{lastReactionMs} ms</Text>
            <Text style={styles.areaSubText}>Nice tap!</Text>
          </>
        )}
      </Pressable>

      <View style={styles.controls}>
        {(gameState === 'idle' ||
          gameState === 'result' ||
          gameState === 'tooSoon') && (
          <Button
            title={entries.length === 0 ? 'Start' : 'Try Again'}
            onPress={handleStart}
          />
        )}
        {gameState === 'waiting' && (
          <Button title="Cancel" onPress={handleReset} color="#dc2626" />
        )}
      </View>

      <View style={styles.statsRow}>
        <Stat label="Attempts" value={entries.length.toString()} />
        <Stat
          label="Best"
          value={best != null ? `${best} ms` : '—'}
        />
        <Stat
          label="Average"
          value={avg != null ? `${Math.round(avg)} ms` : '—'}
        />
      </View>

      <Text style={styles.listHeading}>
        Attempts this session ({entries.length})
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attempts yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>Attempt {item.attemptNumber}</Text>
            <Text style={styles.entryValue}>{item.reactionMs} ms</Text>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title="Finish Activity"
          onPress={handleFinish}
          disabled={isInteractive}
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
  heading: { fontSize: 20, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  area: {
    borderRadius: 12,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 160,
  },
  areaIdle: { backgroundColor: '#e5e7eb' },
  areaWaiting: { backgroundColor: '#f59e0b' },
  areaGo: { backgroundColor: '#16a34a' },
  areaTooSoon: { backgroundColor: '#dc2626' },
  areaResult: { backgroundColor: '#2563eb' },
  areaText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  areaTextLarge: { fontSize: 36, fontWeight: '800', color: '#fff' },
  areaSubText: { fontSize: 14, color: '#fff', marginTop: 4, opacity: 0.9 },
  controls: { marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  listHeading: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  list: { flex: 1 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', paddingVertical: 8 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryLabel: { fontSize: 15, color: '#111827' },
  entryValue: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  finishButton: { marginTop: 12 },
});
