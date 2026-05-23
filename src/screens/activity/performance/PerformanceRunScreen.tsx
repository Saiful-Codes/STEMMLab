import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  PerformanceBucket,
  PerformanceEntry,
  PerformanceMeta,
  saveAttempt,
} from '../../../storage/attempts';
import {
  bucketFromPeak,
  computeSmoothness,
  shakeMagnitude,
} from '../../../utils/performanceMetrics';
import { useTranslation } from '../../../context/LanguageContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

const SAMPLE_INTERVAL_MS = 50;
const FEEDBACK_PULSE_MS = 40;
const FEEDBACK_INTERVAL_MS = 800;

type MovementKey = 'movement1' | 'movement2' | 'movement3';

const MOVEMENTS: { key: MovementKey; number: 1 | 2 | 3 }[] = [
  { key: 'movement1', number: 1 },
  { key: 'movement2', number: 2 },
  { key: 'movement3', number: 3 },
];

type TrialResult = {
  peakMagnitude: number;
  avgMagnitude: number;
  smoothnessScore: number;
  durationMs: number;
  samples: number;
  actualBucket: PerformanceBucket;
  predictionCorrect: boolean;
  vibrationFeedbackUsed: boolean;
};

type TrialState = {
  prediction: PerformanceBucket | null;
  notes: string;
  result: TrialResult | null;
};

const EMPTY_TRIAL: TrialState = {
  prediction: null,
  notes: '',
  result: null,
};

export default function PerformanceRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [vibrationFeedbackEnabled, setVibrationFeedbackEnabled] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [trials, setTrials] = useState<TrialState[]>([
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
  ]);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const feedbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const peakRef = useRef(0);
  const sumRef = useRef(0);
  const sumDeltaRef = useRef(0);
  const samplesRef = useRef(0);
  const lastMagnitudeRef = useRef<number | null>(null);

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
    if (feedbackIntervalRef.current) {
      clearInterval(feedbackIntervalRef.current);
      feedbackIntervalRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const updateTrial = (index: number, patch: Partial<TrialState>) => {
    setTrials((prev) => prev.map((tr, i) => (i === index ? { ...tr, ...patch } : tr)));
  };

  const handleStart = (index: number) => {
    if (isAvailable === false) {
      Alert.alert(
        t('run.performance.alert.unavailableTitle'),
        t('run.performance.alert.unavailableMessage'),
      );
      return;
    }

    const trial = trials[index];
    if (!trial.prediction) {
      Alert.alert(
        t('run.performance.alert.missingPredictionTitle'),
        t('run.performance.alert.missingPredictionMessage'),
      );
      return;
    }

    peakRef.current = 0;
    sumRef.current = 0;
    sumDeltaRef.current = 0;
    samplesRef.current = 0;
    lastMagnitudeRef.current = null;
    startTimeRef.current = Date.now();

    setLiveMagnitude(0);
    setElapsedMs(0);
    setRecordingIndex(index);

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const m = shakeMagnitude(x, y, z);
      sumRef.current += m;
      samplesRef.current += 1;
      if (m > peakRef.current) peakRef.current = m;
      if (lastMagnitudeRef.current != null) {
        sumDeltaRef.current += Math.abs(m - lastMagnitudeRef.current);
      }
      lastMagnitudeRef.current = m;
      setLiveMagnitude(m);
    });

    tickRef.current = setInterval(() => {
      if (startTimeRef.current == null) return;
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    if (vibrationFeedbackEnabled) {
      // brief haptic pulse every FEEDBACK_INTERVAL_MS while recording
      feedbackIntervalRef.current = setInterval(() => {
        Vibration.vibrate(FEEDBACK_PULSE_MS);
      }, FEEDBACK_INTERVAL_MS);
    }
  };

  const handleStop = (index: number) => {
    if (recordingIndex !== index || startTimeRef.current == null) return;

    const durationMs = Date.now() - startTimeRef.current;
    const samples = samplesRef.current;
    const peak = peakRef.current;
    const avg = samples > 0 ? sumRef.current / samples : 0;
    const smoothness = computeSmoothness(sumDeltaRef.current, samples);
    const feedbackUsed = vibrationFeedbackEnabled;

    stopSampling();
    Vibration.cancel();
    setRecordingIndex(null);
    setElapsedMs(durationMs);

    if (samples === 0) {
      Alert.alert(
        t('run.performance.alert.noDataTitle'),
        t('run.performance.alert.noDataMessage'),
      );
      return;
    }

    const actualBucket = bucketFromPeak(peak);
    const prediction = trials[index].prediction!;
    const result: TrialResult = {
      peakMagnitude: peak,
      avgMagnitude: avg,
      smoothnessScore: smoothness,
      durationMs,
      samples,
      actualBucket,
      predictionCorrect: prediction === actualBucket,
      vibrationFeedbackUsed: feedbackUsed,
    };

    updateTrial(index, { result });

    if (index < trials.length - 1) {
      setExpandedIndex(index + 1);
    } else {
      setExpandedIndex(-1);
    }
  };

  const allDone = trials.every((tr) => tr.result !== null);

  const handleFinish = async () => {
    if (!allDone) {
      Alert.alert(
        t('run.performance.alert.notReadyTitle'),
        t('run.performance.alert.notReadyMessage'),
      );
      return;
    }

    setIsFinishing(true);

    const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entries: PerformanceEntry[] = trials.map((tr, i) => {
      const movement = MOVEMENTS[i];
      const r = tr.result!;
      return {
        id: `${baseId}-${movement.number}`,
        movementNumber: movement.number,
        movementLabel: t(`run.performance.${movement.key}.title`),
        prediction: tr.prediction!,
        actualBucket: r.actualBucket,
        predictionCorrect: r.predictionCorrect,
        durationMs: r.durationMs,
        peakMagnitude: r.peakMagnitude,
        avgMagnitude: r.avgMagnitude,
        smoothnessScore: r.smoothnessScore,
        samples: r.samples,
        vibrationFeedbackUsed: r.vibrationFeedbackUsed,
        notes: tr.notes.trim() ? tr.notes.trim() : undefined,
      };
    });

    const meta: PerformanceMeta = { vibrationFeedbackEnabled };

    try {
      await saveAttempt({
        id: baseId,
        activityId,
        finishedAt: Date.now(),
        entries,
        meta,
      });
    } catch (e) {
      console.log('Save attempt error:', e);
    }

    setIsFinishing(false);
    navigation.replace('ActivityResult', { activityId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.performance.heading')}</Text>
      <Text style={styles.subheading}>{t('run.performance.subheading')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('run.performance.setup')}</Text>
        <View style={styles.toggleRow}>
          <FeedbackButton
            label={t('run.performance.feedbackOff')}
            selected={!vibrationFeedbackEnabled}
            disabled={recordingIndex !== null}
            onPress={() => setVibrationFeedbackEnabled(false)}
          />
          <FeedbackButton
            label={t('run.performance.feedbackOn')}
            selected={vibrationFeedbackEnabled}
            disabled={recordingIndex !== null}
            onPress={() => setVibrationFeedbackEnabled(true)}
          />
        </View>
        <Text style={styles.hint}>{t('run.performance.feedbackHint')}</Text>
      </View>

      {trials.map((trial, index) => (
        <MovementCard
          key={MOVEMENTS[index].key}
          index={index}
          movementKey={MOVEMENTS[index].key}
          trial={trial}
          expanded={expandedIndex === index}
          isRecording={recordingIndex === index}
          recordingInProgress={recordingIndex !== null}
          liveMagnitude={liveMagnitude}
          elapsedMs={elapsedMs}
          isAvailable={isAvailable}
          onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
          onUpdate={(patch) => updateTrial(index, patch)}
          onStart={() => handleStart(index)}
          onStop={() => handleStop(index)}
          t={t}
        />
      ))}

      <Pressable
        onPress={handleFinish}
        disabled={!allDone || recordingIndex !== null || isFinishing}
        style={[
          styles.finishBtn,
          (!allDone || recordingIndex !== null || isFinishing) && styles.finishBtnDisabled,
        ]}
      >
        <Text style={styles.finishBtnText}>{t('run.performance.finish')}</Text>
      </Pressable>
      {!allDone && (
        <Text style={styles.finishHint}>{t('run.performance.finishHint')}</Text>
      )}
    </ScrollView>
  );
}

type MovementCardProps = {
  index: number;
  movementKey: MovementKey;
  trial: TrialState;
  expanded: boolean;
  isRecording: boolean;
  recordingInProgress: boolean;
  liveMagnitude: number;
  elapsedMs: number;
  isAvailable: boolean | null;
  onToggle: () => void;
  onUpdate: (patch: Partial<TrialState>) => void;
  onStart: () => void;
  onStop: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function MovementCard({
  movementKey,
  trial,
  expanded,
  isRecording,
  recordingInProgress,
  liveMagnitude,
  elapsedMs,
  isAvailable,
  onToggle,
  onUpdate,
  onStart,
  onStop,
  t,
}: MovementCardProps) {
  const isDone = trial.result !== null;
  const titleKey = `run.performance.${movementKey}.title`;
  const subKey = `run.performance.${movementKey}.sub`;
  const instructionsKey = `run.performance.${movementKey}.instructions`;
  const bucketKey = (b: PerformanceBucket) =>
    t(`run.performance.bucket.${b}`);

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <Pressable onPress={onToggle} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{t(titleKey)}</Text>
          <Text style={styles.cardSub}>{t(subKey)}</Text>
        </View>
        <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgePending]}>
          <Text
            style={[
              styles.badgeText,
              isDone ? styles.badgeTextDone : styles.badgeTextPending,
            ]}
          >
            {isDone
              ? t('run.performance.statusDone')
              : t('run.performance.statusPending')}
          </Text>
        </View>
      </Pressable>

      {expanded && !isDone && (
        <View style={styles.cardBody}>
          <Text style={styles.instructions}>{t(instructionsKey)}</Text>

          <Text style={styles.label}>{t('run.performance.prediction.label')}</Text>
          <View style={styles.predictionRow}>
            {(['low', 'medium', 'high'] as PerformanceBucket[]).map((b) => (
              <Pressable
                key={b}
                onPress={() => onUpdate({ prediction: b })}
                disabled={isRecording}
                style={[
                  styles.predictionBtn,
                  trial.prediction === b && styles.predictionBtnActive,
                  isRecording && styles.predictionBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.predictionBtnText,
                    trial.prediction === b && styles.predictionBtnTextActive,
                  ]}
                >
                  {bucketKey(b)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.meterBox}>
            <Text style={styles.meterLabel}>
              {isRecording
                ? t('run.performance.live')
                : t('run.performance.statPeak')}
            </Text>
            <Text style={styles.meterValue}>
              {isRecording
                ? `${liveMagnitude.toFixed(2)} g`
                : '-- g'}
            </Text>
            {isRecording && (
              <Text style={styles.meterSub}>
                {(elapsedMs / 1000).toFixed(1)} s
              </Text>
            )}
          </View>

          <Pressable
            onPress={isRecording ? onStop : onStart}
            disabled={
              isAvailable === false ||
              (!isRecording && recordingInProgress) ||
              !trial.prediction
            }
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnStop,
              (isAvailable === false ||
                (!isRecording && recordingInProgress) ||
                !trial.prediction) && styles.recordBtnDisabled,
            ]}
          >
            <Text style={styles.recordBtnText}>
              {isRecording
                ? t('run.performance.stop')
                : t('run.performance.start')}
            </Text>
          </Pressable>

          <Text style={styles.label}>{t('run.performance.notes')}</Text>
          <TextInput
            value={trial.notes}
            onChangeText={(v) => onUpdate({ notes: v })}
            placeholder={t('run.performance.notesPlaceholder')}
            editable={!isRecording}
            multiline
            style={[styles.input, styles.notesInput]}
          />
        </View>
      )}

      {isDone && trial.result && (
        <View style={styles.resultGrid}>
          <StatCard
            label={t('run.performance.statSmoothness')}
            value={t('result.performance.smoothnessValue', {
              value: trial.result.smoothnessScore,
            })}
          />
          <StatCard
            label={t('run.performance.statPeak')}
            value={t('result.performance.peakValue', {
              value: trial.result.peakMagnitude.toFixed(2),
            })}
          />
          <StatCard
            label={t('run.performance.statDuration')}
            value={t('result.performance.durationValue', {
              seconds: (trial.result.durationMs / 1000).toFixed(1),
            })}
          />
          <StatCard
            label={t('run.performance.statActual')}
            value={bucketKey(trial.result.actualBucket)}
          />
          <StatCard
            label={t('run.performance.statPrediction')}
            value={
              trial.result.predictionCorrect
                ? t('run.performance.statCorrect')
                : t('run.performance.statIncorrect')
            }
          />
        </View>
      )}
    </View>
  );
}

function FeedbackButton({
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
        styles.toggleBtn,
        selected && styles.toggleBtnActive,
        disabled && styles.toggleBtnDisabled,
      ]}
    >
      <Text
        style={[styles.toggleText, selected && styles.toggleTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardDone: { borderColor: '#22c55e', borderWidth: 2 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardBody: { marginTop: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeDone: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextPending: { color: '#f59e0b' },
  badgeTextDone: { color: '#22c55e' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  instructions: { fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 8 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  toggleBtnDisabled: { opacity: 0.5 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#fff' },
  predictionRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  predictionBtn: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  predictionBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  predictionBtnDisabled: { opacity: 0.5 },
  predictionBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  predictionBtnTextActive: { color: '#fff' },
  meterBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  meterLabel: { fontSize: 11, color: '#6b7280' },
  meterValue: { fontSize: 28, fontWeight: '800', color: '#2563eb', marginTop: 4 },
  meterSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  recordBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  recordBtnStop: { backgroundColor: '#dc2626' },
  recordBtnDisabled: { backgroundColor: '#d1d5db' },
  recordBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  finishBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  finishBtnDisabled: { backgroundColor: '#d1d5db' },
  finishBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  finishHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
});
