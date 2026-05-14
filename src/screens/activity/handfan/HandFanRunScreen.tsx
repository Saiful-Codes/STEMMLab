import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  HandFanEntry,
  HandFanMeta,
  HandFanTrialResult,
  saveAttempt,
} from '../../../storage/attempts';
import {
  MATERIALS,
  DISTANCES,
  getMaterial,
  calculateForce,
} from '../../../utils/handFanPhysics';
import { useTranslation } from '../../../context/LanguageContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

type TrialState = {
  designName: string;
  predictedAngle: string;
  actualAngle: string;
  notes: string;
  result: HandFanTrialResult | null;
};

const TRIAL_LABELS: { key: string; subKey: string }[] = [
  { key: 'run.handfan.design1', subKey: 'run.handfan.design1Sub' },
  { key: 'run.handfan.design2', subKey: 'run.handfan.design2Sub' },
  { key: 'run.handfan.design3', subKey: 'run.handfan.design3Sub' },
];

const EMPTY_TRIAL: TrialState = {
  designName: '',
  predictedAngle: '',
  actualAngle: '',
  notes: '',
  result: null,
};

export default function HandFanRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();

  const [materialType, setMaterialType] = useState(MATERIALS[0].key);
  const [distance, setDistance] = useState(DISTANCES[1]);
  const [trials, setTrials] = useState<TrialState[]>([
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
  ]);
  const [expandedTrial, setExpandedTrial] = useState(0);

  const updateTrial = (index: number, patch: Partial<TrialState>) => {
    setTrials((prev) => prev.map((tr, i) => (i === index ? { ...tr, ...patch } : tr)));
  };

  const handleRecord = (index: number) => {
    const trial = trials[index];

    if (!trial.designName.trim()) {
      Alert.alert(
        t('run.handfan.alert.missingDesignTitle'),
        t('run.handfan.alert.missingDesignMessage'),
      );
      return;
    }

    const predicted = parseFloat(trial.predictedAngle);
    const actual = parseFloat(trial.actualAngle);

    if (!predicted || predicted <= 0 || predicted > 180 || !actual || actual <= 0 || actual > 180) {
      Alert.alert(
        t('run.handfan.alert.invalidAngleTitle'),
        t('run.handfan.alert.invalidAngleMessage'),
      );
      return;
    }

    const material = getMaterial(materialType);
    const stiffness = material?.stiffness ?? 0.05;
    const result = calculateForce(stiffness, actual);
    updateTrial(index, { result });

    if (index < 2) {
      setExpandedTrial(index + 1);
    }
  };

  const allDone = trials.every((tr) => tr.result !== null);

  const handleFinish = async () => {
    if (!allDone) {
      Alert.alert(
        t('run.handfan.alert.missingTrialsTitle'),
        t('run.handfan.alert.missingTrialsMessage'),
      );
      return;
    }

    const entries: HandFanEntry[] = trials.map((tr, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      trialNumber: (i + 1) as 1 | 2 | 3,
      trialLabel: t(TRIAL_LABELS[i].key),
      input: {
        designName: tr.designName.trim(),
        predictedAngle: parseFloat(tr.predictedAngle),
        actualAngle: parseFloat(tr.actualAngle),
        notes: tr.notes.trim(),
      },
      result: tr.result!,
    }));

    const meta: HandFanMeta = { materialType, distance };

    try {
      await saveAttempt({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        activityId,
        finishedAt: Date.now(),
        entries,
        meta,
      });
    } catch (e) {
      console.log('Save attempt error:', e);
    }

    navigation.replace('ActivityResult', { activityId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.handfan.heading')}</Text>
      <Text style={styles.subheading}>{t('run.handfan.subheading')}</Text>

      {/* Setup Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('run.handfan.setup')}</Text>

        <Text style={styles.label}>{t('run.handfan.materialType')}</Text>
        <View style={styles.materialGrid}>
          {MATERIALS.map((mat) => (
            <Pressable
              key={mat.key}
              onPress={() => setMaterialType(mat.key)}
              style={[
                styles.materialBtn,
                materialType === mat.key && styles.materialBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.materialBtnText,
                  materialType === mat.key && styles.materialBtnTextActive,
                ]}
              >
                {t(`run.handfan.material.${mat.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('run.handfan.distance')}</Text>
        <View style={styles.toggleRow}>
          {DISTANCES.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDistance(d)}
              style={[styles.toggleBtn, distance === d && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleText,
                  distance === d && styles.toggleTextActive,
                ]}
              >
                {t('run.handfan.distanceUnit', { value: d })}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Trial Cards */}
      {trials.map((trial, index) => (
        <TrialCard
          key={index}
          index={index}
          trial={trial}
          expanded={expandedTrial === index}
          onToggle={() => setExpandedTrial(expandedTrial === index ? -1 : index)}
          onUpdate={(patch) => updateTrial(index, patch)}
          onRecord={() => handleRecord(index)}
          t={t}
        />
      ))}

      {/* Finish Button */}
      <Pressable
        onPress={handleFinish}
        disabled={!allDone}
        style={[styles.finishBtn, !allDone && styles.finishBtnDisabled]}
      >
        <Text style={styles.finishBtnText}>{t('run.handfan.finish')}</Text>
      </Pressable>
      {!allDone && (
        <Text style={styles.finishHint}>{t('run.handfan.finishHint')}</Text>
      )}
    </ScrollView>
  );
}

type TrialCardProps = {
  index: number;
  trial: TrialState;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<TrialState>) => void;
  onRecord: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function TrialCard({
  index,
  trial,
  expanded,
  onToggle,
  onUpdate,
  onRecord,
  t,
}: TrialCardProps) {
  const isDone = trial.result !== null;
  const label = TRIAL_LABELS[index];

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <Pressable onPress={onToggle} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{t(label.key)}</Text>
          <Text style={styles.cardSub}>{t(label.subKey)}</Text>
        </View>
        <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgePending]}>
          <Text
            style={[
              styles.badgeText,
              isDone ? styles.badgeTextDone : styles.badgeTextPending,
            ]}
          >
            {isDone ? t('run.handfan.statusDone') : t('run.handfan.statusPending')}
          </Text>
        </View>
      </Pressable>

      {expanded && !isDone && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>{t('run.handfan.designName')}</Text>
          <TextInput
            value={trial.designName}
            onChangeText={(v) => onUpdate({ designName: v })}
            placeholder={t('run.handfan.designNamePlaceholder')}
            style={styles.input}
          />

          <Text style={styles.label}>{t('run.handfan.predictedAngle')}</Text>
          <TextInput
            value={trial.predictedAngle}
            onChangeText={(v) => onUpdate({ predictedAngle: v })}
            placeholder={t('run.handfan.anglePlaceholder')}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>{t('run.handfan.actualAngle')}</Text>
          <TextInput
            value={trial.actualAngle}
            onChangeText={(v) => onUpdate({ actualAngle: v })}
            placeholder={t('run.handfan.anglePlaceholder')}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>{t('run.handfan.notes')}</Text>
          <TextInput
            value={trial.notes}
            onChangeText={(v) => onUpdate({ notes: v })}
            placeholder={t('run.handfan.notesPlaceholder')}
            multiline
            style={[styles.input, styles.notesInput]}
          />

          <Pressable onPress={onRecord} style={styles.calcBtn}>
            <Text style={styles.calcBtnText}>{t('run.handfan.record')}</Text>
          </Pressable>
        </View>
      )}

      {isDone && (
        <View style={styles.resultGrid}>
          <StatCard
            label={t('run.handfan.predictedAngle')}
            value={`${trial.predictedAngle}°`}
          />
          <StatCard
            label={t('run.handfan.actualAngle')}
            value={`${trial.actualAngle}°`}
          />
          <StatCard
            label={t('result.handfan.differenceRow')}
            value={`${(parseFloat(trial.actualAngle) - parseFloat(trial.predictedAngle)).toFixed(1)}°`}
          />
        </View>
      )}
    </View>
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
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 8 },
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
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  materialBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  materialBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  materialBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  materialBtnTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#fff' },
  calcBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  calcBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
  statValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
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
