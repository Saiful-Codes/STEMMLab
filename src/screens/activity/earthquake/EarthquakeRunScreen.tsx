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
import { EarthquakeEntry } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';
import { useLocation } from '../../../context/LocationContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useTeam } from '../../../context/TeamContext';
import { saveActivityResultWithLocation } from '../../../utils/activityResultHelper';
import type { Result } from '../../../types/Result';

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
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const { team } = useTeam();
  const { location, refreshLocation } = useLocation();
  const { sendAchievement } = useNotifications();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<SimulationMode>('manual');
  const [isRunning, setIsRunning] = useState(false);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [peakMagnitude, setPeakMagnitude] = useState(0);
  const [avgMagnitude, setAvgMagnitude] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [entries, setEntries] = useState<EarthquakeEntry[]>([]);

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
    // Get location on mount
    refreshLocation();
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
        t('run.earthquake.alert.unavailableTitle'),
        t('run.earthquake.alert.unavailableMessage')
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
      Alert.alert(
        t('run.earthquake.alert.noDataTitle'),
        t('run.earthquake.alert.noDataMessage')
      );
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
      Alert.alert(
        t('run.earthquake.alert.noAttemptsTitle'),
        t('run.earthquake.alert.noAttemptsMessage')
      );
      return;
    }

    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    try {
      // Refresh location before finishing
      await refreshLocation();

      const peak = Math.max(...entries.map((e) => e.peakMagnitude));

      // Save result with GPS location
      const result: Result = {
        id: `result_${Date.now()}`,
        activityId,
        teamName: team.name,
        members: team.members,
        result: Number(peak.toFixed(2)),
        timestamp: Date.now(),
      };

      await saveActivityResultWithLocation(result, location);

      // Send completion notification
      await sendAchievement(
        'Earthquake Structure Complete! 🏗️',
        `${team.name} tested earthquake resistance${location?.locationName ? ` at ${location.locationName}` : ''}`
      );

      Alert.alert(
  'Activity Saved!',
  `GPS location captured:\n${location?.locationName || 'Unknown location'}`
);


      navigation.replace('ResultSummary', {
        activityId,
        result: Number(peak.toFixed(2)),
      });
    } catch (err) {
      console.error('Error finishing activity:', err);
      Alert.alert('Error', 'Failed to save activity result');
    }
  };

  const liveDisplay = isRunning
    ? `${liveMagnitude.toFixed(2)} g`
    : peakMagnitude > 0
    ? `${peakMagnitude.toFixed(2)} g`
    : '-- g';

  const liveHint = isRunning
    ? mode === 'simulate'
      ? t('run.earthquake.hint.simulating')
      : t('run.earthquake.hint.shaking')
    : peakMagnitude > 0
    ? t('run.earthquake.hint.complete')
    : isAvailable === false
    ? t('run.earthquake.hint.unavailable')
    : mode === 'simulate'
    ? t('run.earthquake.hint.simulatePrompt')
    : t('run.earthquake.hint.manualPrompt');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('run.earthquake.heading')}</Text>
      <Text style={styles.subheading}>{t('run.earthquake.subheading')}</Text>

      <View style={styles.modeRow}>
        <ModeButton
          label={t('run.earthquake.mode.manual')}
          selected={mode === 'manual'}
          disabled={isRunning}
          onPress={() => setMode('manual')}
          styles={styles}
        />
        <ModeButton
          label={t('run.earthquake.mode.simulate')}
          selected={mode === 'simulate'}
          disabled={isRunning}
          onPress={() => setMode('simulate')}
          styles={styles}
        />
      </View>

      <View style={styles.meterBox}>
        <Text style={styles.meterLabel}>
          {isRunning
            ? t('run.earthquake.meter.live')
            : t('run.earthquake.meter.lastPeak')}
        </Text>
        <Text style={styles.meterValue}>{liveDisplay}</Text>
        <Text style={styles.meterHint}>{liveHint}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat
          label={t('run.earthquake.stat.time')}
          value={`${(elapsedMs / 1000).toFixed(1)} s`}
          styles={styles}
        />
        <Stat
          label={t('run.earthquake.stat.peak')}
          value={`${peakMagnitude.toFixed(2)} g`}
          styles={styles}
        />
        <Stat
          label={t('run.earthquake.stat.average')}
          value={`${avgMagnitude.toFixed(2)} g`}
          styles={styles}
        />
      </View>

      <View style={styles.controls}>
        <Button
          title={
            isRunning ? t('run.earthquake.stop') : t('run.earthquake.start')
          }
          onPress={isRunning ? handleStop : handleStart}
          color={isRunning ? colors.danger : undefined}
          disabled={isAvailable === false}
        />
      </View>

      <Text style={styles.listHeading}>
        {t('run.earthquake.attemptsHeading', { count: entries.length })}
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('run.earthquake.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>
              {t('run.earthquake.attemptLabel', { n: item.attemptNumber })}
            </Text>
            <View style={styles.entryRight}>
              <Text style={styles.entryValue}>
                {t('run.earthquake.entryPeak', {
                  value: item.peakMagnitude.toFixed(2),
                })}
              </Text>
              <Text style={styles.entrySub}>
                {t('run.earthquake.entrySub', {
                  seconds: (item.durationMs / 1000).toFixed(1),
                  avg: item.avgMagnitude.toFixed(2),
                })}
              </Text>
            </View>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title={t('run.earthquake.finish')}
          onPress={handleFinish}
          disabled={isRunning}
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

function ModeButton({
  label,
  selected,
  disabled,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  styles: Styles;
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

const makeStyles = (colors: Colors, fontScale: number) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.background },
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    subheading: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted, marginBottom: 12 },
    modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    modeButton: {
      flexGrow: 1,
      flexBasis: 0,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    modeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeButtonDisabled: { opacity: 0.5 },
    modeButtonText: { fontSize: baseFont.bodySm * fontScale, fontWeight: '600', color: colors.text },
    modeButtonTextSelected: { color: colors.primaryText },
    meterBox: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    meterLabel: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted },
    meterValue: { fontSize: 36 * fontScale, fontWeight: '800', color: colors.primary, marginTop: 4 },
    meterHint: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
    controls: { marginBottom: 12 },
    listHeading: { fontSize: baseFont.bodySm * fontScale, fontWeight: '600', marginBottom: 6, color: colors.text },
    list: { flex: 1 },
    emptyText: { color: colors.textSubtle, fontStyle: 'italic', paddingVertical: 8 },
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
    finishButton: { marginTop: 12 },
  });
