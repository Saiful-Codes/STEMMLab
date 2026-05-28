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
import { Accelerometer } from 'expo-sensors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import { BreathingEntry, saveAttempt } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTeam } from '../../../context/TeamContext';
import { useLocation } from '../../../context/LocationContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

const SAMPLE_INTERVAL_MS = 50;

type ExerciseMode = 'rest' | 'exercise';

// Detect breathing peaks from acceleration magnitude
// A breath typically corresponds to a small cyclic motion (0.1 to 0.3g range)
function estimateBreathingRate(
  samples: { magnitude: number; timestamp: number }[],
  durationMs: number
): number {
  if (samples.length < 10 || durationMs < 1000) return 0;

  // Find peaks in magnitude (breathing cycles)
  let peakCount = 0;
  const threshold = 0.05; // Minimum magnitude change to detect movement
  const minPeakDistance = 300; // Minimum ms between peaks (min breathing rate ~20 BPM = 300ms per breath)

  let lastPeakTime = -minPeakDistance;
  let lastMagnitude = samples[0].magnitude;

  for (let i = 1; i < samples.length; i++) {
    const currentMagnitude = samples[i].magnitude;
    const magnitudeDiff = Math.abs(currentMagnitude - lastMagnitude);

    // Detect a peak (change in movement)
    if (magnitudeDiff > threshold && samples[i].timestamp - lastPeakTime >= minPeakDistance) {
      peakCount++;
      lastPeakTime = samples[i].timestamp;
    }

    lastMagnitude = currentMagnitude;
  }

  // Convert peaks to BPM (2 peaks per breath cycle = 1 breath)
  const breathCount = Math.max(1, Math.floor(peakCount / 2));
  const minutes = durationMs / 60000;
  const bpm = Math.round(breathCount / minutes);

  return Math.min(bpm, 120); // Cap at 120 BPM for sanity
}

export default function BreathingRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { team } = useTeam();
  const { refreshLocation } = useLocation();
  const [isFinishing, setIsFinishing] = useState(false);

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<ExerciseMode>('rest');
  const [isRunning, setIsRunning] = useState(false);
  const [liveX, setLiveX] = useState(0);
  const [liveY, setLiveY] = useState(0);
  const [liveZ, setLiveZ] = useState(0);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [breathingRate, setBreathingRate] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [entries, setEntries] = useState<BreathingEntry[]>([]);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const samplesRef = useRef<{ magnitude: number; timestamp: number }[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!cancelled) setIsAvailable(available);
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      });
    return () => {
      cancelled = true;
      stopSampling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopSampling = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const calculateMagnitude = (x: number, y: number, z: number) => {
    // Subtract 1g from the dominant axis (typically z when phone is on chest)
    // to measure just the breathing movement
    const adjustedZ = Math.abs(z - 1);
    return Math.sqrt(x * x + y * y + adjustedZ * adjustedZ);
  };

  const handleStart = () => {
    if (isAvailable === false) {
      Alert.alert(
        t('run.breathing.alert.unavailableTitle'),
        t('run.breathing.alert.unavailableMessage')
      );
      return;
    }

    samplesRef.current = [];
    startTimeRef.current = Date.now();

    setLiveX(0);
    setLiveY(0);
    setLiveZ(0);
    setLiveMagnitude(0);
    setBreathingRate(0);
    setElapsedMs(0);
    setIsRunning(true);

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = calculateMagnitude(x, y, z);
      setLiveX(x);
      setLiveY(y);
      setLiveZ(z);
      setLiveMagnitude(magnitude);

      const now = Date.now();
      samplesRef.current.push({
        magnitude,
        timestamp: now,
      });
    });

    tickRef.current = setInterval(() => {
      if (startTimeRef.current == null) return;
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      // Update breathing rate every 2 seconds
      if (elapsed % 2000 < SAMPLE_INTERVAL_MS) {
        const bpm = estimateBreathingRate(samplesRef.current, elapsed);
        setBreathingRate(bpm);
      }
    }, SAMPLE_INTERVAL_MS);
  };

  const handleStop = () => {
    if (!isRunning || startTimeRef.current == null) return;

    const durationMs = Date.now() - startTimeRef.current;
    const samples = samplesRef.current.length;
    const bpm = estimateBreathingRate(samplesRef.current, durationMs);

    stopSampling();
    setIsRunning(false);
    setElapsedMs(durationMs);
    setBreathingRate(bpm);

    if (samples === 0) {
      Alert.alert(
        t('run.breathing.alert.noDataTitle'),
        t('run.breathing.alert.noDataMessage')
      );
      return;
    }

    const newEntry: BreathingEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      attemptNumber: entries.length + 1,
      mode,
      durationMs,
      breathingRate: bpm,
      sampleCount: samples,
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleFinish = async () => {
    if (entries.length === 0) {
      Alert.alert(
        t('run.breathing.alert.noEntriesTitle'),
        t('run.breathing.alert.noEntriesMessage')
      );
      return;
    }

    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    setIsFinishing(true);

    try {
      await refreshLocation();

      const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // entries state holds newest-first; persist in chronological order so
      // attemptNumber 1 is first in the result screen.
      const ordered = [...entries].reverse();

      await saveAttempt<BreathingEntry>({
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

  const liveDisplay = isRunning
    ? `${breathingRate} BPM`
    : breathingRate > 0
    ? `${breathingRate} BPM`
    : '-- BPM';

  const liveHint = isRunning
    ? t('run.breathing.hint.measuring')
    : breathingRate > 0
    ? t('run.breathing.hint.complete')
    : isAvailable === false
    ? t('run.breathing.hint.unavailable')
    : t('run.breathing.hint.ready');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('run.breathing.heading')}</Text>
      <Text style={styles.subheading}>{t('run.breathing.subheading')}</Text>

      <View style={styles.modeRow}>
        <ModeButton
          label={t('run.breathing.mode.rest')}
          selected={mode === 'rest'}
          disabled={isRunning}
          onPress={() => setMode('rest')}
        />
        <ModeButton
          label={t('run.breathing.mode.exercise')}
          selected={mode === 'exercise'}
          disabled={isRunning}
          onPress={() => setMode('exercise')}
        />
      </View>

      <View style={styles.meterBox}>
        <Text style={styles.meterLabel}>
          {isRunning
            ? t('run.breathing.meter.live')
            : t('run.breathing.meter.lastRate')}
        </Text>
        <Text style={styles.meterValue}>{liveDisplay}</Text>
        <Text style={styles.meterHint}>{liveHint}</Text>
      </View>

      <View style={styles.sensorBox}>
        <Text style={styles.sensorLabel}>{t('run.breathing.sensor.title')}</Text>
        <View style={styles.sensorRow}>
          <SensorValue label="X" value={liveX.toFixed(2)} />
          <SensorValue label="Y" value={liveY.toFixed(2)} />
          <SensorValue label="Z" value={liveZ.toFixed(2)} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat
          label={t('run.breathing.stat.time')}
          value={`${(elapsedMs / 1000).toFixed(1)} s`}
        />
        <Stat
          label={t('run.breathing.stat.breathing')}
          value={`${breathingRate} BPM`}
        />
      </View>

      <View style={styles.controls}>
        <Button
          title={
            isRunning ? t('run.breathing.stop') : t('run.breathing.start')
          }
          onPress={isRunning ? handleStop : handleStart}
          color={isRunning ? '#dc2626' : undefined}
          disabled={isAvailable === false}
        />
      </View>

      <Text style={styles.listHeading}>
        {t('run.breathing.attemptsHeading', { count: entries.length })}
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('run.breathing.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <View>
              <Text style={styles.entryLabel}>
                {t('run.breathing.attemptLabel', { n: item.attemptNumber })}
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
                {t('run.breathing.entrySub', {
                  seconds: (item.durationMs / 1000).toFixed(1),
                })}
              </Text>
            </View>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title={t('run.breathing.finish')}
          onPress={handleFinish}
          disabled={isRunning || isFinishing}
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

function SensorValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sensorValue}>
      <Text style={styles.sensorValueLabel}>{label}</Text>
      <Text style={styles.sensorValueText}>{value}</Text>
    </View>
  );
}

function ModeButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.modeButton,
        selected && styles.modeButtonSelected,
        disabled && styles.modeButtonDisabled,
      ]}
    >
      <Text
        style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeButton: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  modeButtonDisabled: { opacity: 0.5 },
  modeButtonText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  modeButtonTextSelected: { color: '#fff' },
  meterBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  meterLabel: { fontSize: 12, color: '#6b7280' },
  meterValue: { fontSize: 36, fontWeight: '800', color: '#2563eb', marginTop: 4 },
  meterHint: { fontSize: 12, color: '#6b7280', marginTop: 6, textAlign: 'center' },
  sensorBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sensorLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  sensorRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-around' },
  sensorValue: { alignItems: 'center' },
  sensorValueLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  sensorValueText: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  controls: { marginBottom: 12 },
  listHeading: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
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
  finishButton: { marginTop: 12 },
});
