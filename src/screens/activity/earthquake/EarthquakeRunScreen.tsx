import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import { EarthquakeEntry, saveAttempt } from '../../../storage/attempts';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

const SAMPLE_INTERVAL_MS = 50;

// Looping vibration pattern. Android reads this as [wait, vibrate, wait,
// vibrate, …]; iOS reads every value as a wait between fixed ~400 ms pulses.
// Either way it produces a rhythmic shake while the test is running.
const SIMULATION_PATTERN = [0, 800, 150, 800];

type SimulationMode = 'manual' | 'simulate';

// Phone at rest reads ~1g on its dominant axis. The "shake" component is the
// deviation of the total acceleration vector magnitude from 1g.
function shakeMagnitude(x: number, y: number, z: number): number {
  const total = Math.sqrt(x * x + y * y + z * z);
  return Math.abs(total - 1);
}

export default function EarthquakeRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<SimulationMode>('manual');
  const [isRunning, setIsRunning] = useState(false);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [peakMagnitude, setPeakMagnitude] = useState(0);
  const [avgMagnitude, setAvgMagnitude] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [entries, setEntries] = useState<EarthquakeEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const peakRef = useRef(0);
  const sumRef = useRef(0);
  const samplesRef = useRef(0);
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
      Vibration.cancel();
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

  const handleStart = () => {
    if (isAvailable === false) {
      Alert.alert(
        'Accelerometer unavailable',
        'This device does not provide accelerometer data.'
      );
      return;
    }

    peakRef.current = 0;
    sumRef.current = 0;
    samplesRef.current = 0;
    startTimeRef.current = Date.now();

    setPeakMagnitude(0);
    setAvgMagnitude(0);
    setLiveMagnitude(0);
    setElapsedMs(0);
    setIsRunning(true);

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const m = shakeMagnitude(x, y, z);
      sumRef.current += m;
      samplesRef.current += 1;
      if (m > peakRef.current) peakRef.current = m;
      setLiveMagnitude(m);
    });

    tickRef.current = setInterval(() => {
      if (startTimeRef.current == null) return;
      setElapsedMs(Date.now() - startTimeRef.current);
      setPeakMagnitude(peakRef.current);
      setAvgMagnitude(
        samplesRef.current > 0 ? sumRef.current / samplesRef.current : 0
      );
    }, 100);

    if (mode === 'simulate') {
      Vibration.vibrate(SIMULATION_PATTERN, true);
    }
  };

  const handleStop = () => {
    if (!isRunning || startTimeRef.current == null) return;

    const durationMs = Date.now() - startTimeRef.current;
    const samples = samplesRef.current;
    const peak = peakRef.current;
    const avg = samples > 0 ? sumRef.current / samples : 0;

    stopSampling();
    Vibration.cancel();
    setIsRunning(false);
    setElapsedMs(durationMs);
    setPeakMagnitude(peak);
    setAvgMagnitude(avg);

    if (samples === 0) {
      Alert.alert('No data', 'No accelerometer samples were captured.');
      return;
    }

    const newEntry: EarthquakeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      attemptNumber: entries.length + 1,
      durationMs,
      peakMagnitude: peak,
      avgMagnitude: avg,
      samples,
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleFinish = async () => {
    if (entries.length === 0) {
      Alert.alert('No attempts', 'Run at least one test before finishing.');
      return;
    }
    setSaving(true);
    try {
      await saveAttempt<EarthquakeEntry>({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        activityId,
        finishedAt: Date.now(),
        entries,
      });
      navigation.replace('ActivityResult', { activityId });
    } catch (err) {
      Alert.alert('Save failed', 'Could not save your attempt. Please try again.');
      setSaving(false);
    }
  };

  const liveDisplay = isRunning
    ? `${liveMagnitude.toFixed(2)} g`
    : peakMagnitude > 0
    ? `${peakMagnitude.toFixed(2)} g`
    : '-- g';

  const liveHint = isRunning
    ? mode === 'simulate'
      ? 'Phone is vibrating… tap Stop when the test is complete.'
      : 'Shaking… tap Stop when the test is complete.'
    : peakMagnitude > 0
    ? 'Test complete. Add another attempt or finish.'
    : isAvailable === false
    ? 'Accelerometer not available on this device.'
    : mode === 'simulate'
    ? 'Place phone on the structure, then tap Start Test to vibrate.'
    : 'Place phone on the structure, then tap Start Test and shake.';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Earthquake-Resistant Structure</Text>
      <Text style={styles.subheading}>
        Place the phone on your structure, pick a mode, then tap Start Test.
        Tap Stop to record the result.
      </Text>

      <View style={styles.modeRow}>
        <ModeButton
          label="Manual"
          selected={mode === 'manual'}
          disabled={isRunning}
          onPress={() => setMode('manual')}
        />
        <ModeButton
          label="Simulate Earthquake"
          selected={mode === 'simulate'}
          disabled={isRunning}
          onPress={() => setMode('simulate')}
        />
      </View>

      <View style={styles.meterBox}>
        <Text style={styles.meterLabel}>
          {isRunning ? 'Live shake' : 'Last peak'}
        </Text>
        <Text style={styles.meterValue}>{liveDisplay}</Text>
        <Text style={styles.meterHint}>{liveHint}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Time" value={`${(elapsedMs / 1000).toFixed(1)} s`} />
        <Stat label="Peak" value={`${peakMagnitude.toFixed(2)} g`} />
        <Stat label="Average" value={`${avgMagnitude.toFixed(2)} g`} />
      </View>

      <View style={styles.controls}>
        <Button
          title={isRunning ? 'Stop Test' : 'Start Test'}
          onPress={isRunning ? handleStop : handleStart}
          color={isRunning ? '#dc2626' : undefined}
          disabled={isAvailable === false}
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
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>
                Peak {item.peakMagnitude.toFixed(2)} g
              </Text>
              <Text style={styles.entrySub}>
                {(item.durationMs / 1000).toFixed(1)} s · avg{' '}
                {item.avgMagnitude.toFixed(2)} g
              </Text>
            </View>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title={saving ? 'Saving…' : 'Finish Activity'}
          onPress={handleFinish}
          disabled={saving || isRunning}
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
  entryLabel: { fontSize: 15, color: '#111827' },
  entryRight: { alignItems: 'flex-end' },
  entryValue: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  entrySub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  finishButton: { marginTop: 12 },
});
