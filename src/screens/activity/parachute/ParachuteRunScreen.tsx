import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  ParachuteEntry,
  ParachuteMeta,
  ParachuteTrialInput,
  ParachuteTrialResult,
  StudentLevel,
  saveAttempt,
} from '../../../storage/attempts';
import { calculateTrial, getGForceRisk } from '../../../utils/parachutePhysics';
import { useTranslation } from '../../../context/LanguageContext';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

type TrialState = {
  fallTime: string;
  contactTime: string;
  didBounce: boolean;
  bounceTime: string;
  result: ParachuteTrialResult | null;
};

const TRIAL_LABELS: { key: string; subKey: string }[] = [
  { key: 'run.parachute.trial1', subKey: 'run.parachute.trial1Sub' },
  { key: 'run.parachute.trial2', subKey: 'run.parachute.trial2Sub' },
  { key: 'run.parachute.trial3', subKey: 'run.parachute.trial3Sub' },
];

const EMPTY_TRIAL: TrialState = {
  fallTime: '',
  contactTime: '',
  didBounce: false,
  bounceTime: '',
  result: null,
};

export default function ParachuteRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();

  const [level, setLevel] = useState<StudentLevel>('primary');
  const [dropHeight, setDropHeight] = useState('');
  const [toyMass, setToyMass] = useState('');
  const [trials, setTrials] = useState<TrialState[]>([
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
  ]);
  const [expandedTrial, setExpandedTrial] = useState(0);

  const updateTrial = (index: number, patch: Partial<TrialState>) => {
    setTrials((prev) => prev.map((tr, i) => (i === index ? { ...tr, ...patch } : tr)));
  };

  const handleCalculate = (index: number) => {
    const h = parseFloat(dropHeight);
    const m = parseFloat(toyMass);
    if (!h || h <= 0 || !m || m <= 0) {
      Alert.alert(
        t('run.parachute.alert.missingSetupTitle'),
        t('run.parachute.alert.missingSetupMessage'),
      );
      return;
    }

    const trial = trials[index];
    const ft = parseFloat(trial.fallTime);
    if (!ft || ft <= 0) {
      Alert.alert(
        t('run.parachute.alert.invalidInputTitle'),
        t('run.parachute.alert.invalidInputMessage'),
      );
      return;
    }

    const input: ParachuteTrialInput = { fallTime: ft };

    if (level === 'highschool') {
      const ct = parseFloat(trial.contactTime);
      if (!ct || ct <= 0) {
        Alert.alert(
          t('run.parachute.alert.invalidInputTitle'),
          t('run.parachute.alert.invalidInputMessage'),
        );
        return;
      }
      input.contactTime = ct;
      input.didBounce = trial.didBounce;
      if (trial.didBounce) {
        const bt = parseFloat(trial.bounceTime);
        if (!bt || bt <= 0) {
          Alert.alert(
            t('run.parachute.alert.invalidInputTitle'),
            t('run.parachute.alert.invalidInputMessage'),
          );
          return;
        }
        input.bounceTime = bt;
      }
    }

    const result = calculateTrial(input, h, m, level);
    updateTrial(index, { result });

    if (index < 2) {
      setExpandedTrial(index + 1);
    }
  };

  const allDone = trials.every((tr) => tr.result !== null);

  const handleFinish = async () => {
    if (!allDone) {
      Alert.alert(
        t('run.parachute.alert.missingTrialsTitle'),
        t('run.parachute.alert.missingTrialsMessage'),
      );
      return;
    }

    const h = parseFloat(dropHeight);
    const m = parseFloat(toyMass);

    const entries: ParachuteEntry[] = trials.map((tr, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      trialNumber: (i + 1) as 1 | 2 | 3,
      trialLabel: t(TRIAL_LABELS[i].key),
      input: {
        fallTime: parseFloat(tr.fallTime),
        ...(level === 'highschool' && {
          contactTime: parseFloat(tr.contactTime),
          didBounce: tr.didBounce,
          ...(tr.didBounce && { bounceTime: parseFloat(tr.bounceTime) }),
        }),
      },
      result: tr.result!,
    }));

    const meta: ParachuteMeta = { studentLevel: level, dropHeight: h, toyMass: m };

    const parachuteVelocities = [entries[1], entries[2]].map(
      (e) => e.result.finalVelocity,
    );
    const bestVelocity = Math.min(...parachuteVelocities);

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
      <Text style={styles.heading}>{t('run.parachute.heading')}</Text>
      <Text style={styles.subheading}>{t('run.parachute.subheading')}</Text>

      {/* Setup Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('run.parachute.setup')}</Text>

        <Text style={styles.label}>{t('run.parachute.level')}</Text>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setLevel('primary')}
            style={[styles.toggleBtn, level === 'primary' && styles.toggleBtnActive]}
          >
            <Text
              style={[
                styles.toggleText,
                level === 'primary' && styles.toggleTextActive,
              ]}
            >
              {t('run.parachute.levelPrimary')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLevel('highschool')}
            style={[styles.toggleBtn, level === 'highschool' && styles.toggleBtnActive]}
          >
            <Text
              style={[
                styles.toggleText,
                level === 'highschool' && styles.toggleTextActive,
              ]}
            >
              {t('run.parachute.levelHighSchool')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('run.parachute.dropHeight')}</Text>
            <TextInput
              value={dropHeight}
              onChangeText={setDropHeight}
              placeholder={t('run.parachute.dropHeightPlaceholder')}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('run.parachute.toyMass')}</Text>
            <TextInput
              value={toyMass}
              onChangeText={setToyMass}
              placeholder={t('run.parachute.toyMassPlaceholder')}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>
      </View>

      {/* Trial Cards */}
      {trials.map((trial, index) => (
        <TrialCard
          key={index}
          index={index}
          trial={trial}
          level={level}
          expanded={expandedTrial === index}
          onToggle={() => setExpandedTrial(expandedTrial === index ? -1 : index)}
          onUpdate={(patch) => updateTrial(index, patch)}
          onCalculate={() => handleCalculate(index)}
          t={t}
        />
      ))}

      {/* Finish Button */}
      <Pressable
        onPress={handleFinish}
        disabled={!allDone}
        style={[styles.finishBtn, !allDone && styles.finishBtnDisabled]}
      >
        <Text style={styles.finishBtnText}>{t('run.parachute.finish')}</Text>
      </Pressable>
      {!allDone && (
        <Text style={styles.finishHint}>{t('run.parachute.finishHint')}</Text>
      )}
    </ScrollView>
  );
}

type TrialCardProps = {
  index: number;
  trial: TrialState;
  level: StudentLevel;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<TrialState>) => void;
  onCalculate: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function TrialCard({
  index,
  trial,
  level,
  expanded,
  onToggle,
  onUpdate,
  onCalculate,
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
            {isDone ? t('run.parachute.statusDone') : t('run.parachute.statusPending')}
          </Text>
        </View>
      </Pressable>

      {expanded && !isDone && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>{t('run.parachute.fallTime')}</Text>
          <TextInput
            value={trial.fallTime}
            onChangeText={(v) => onUpdate({ fallTime: v })}
            placeholder={t('run.parachute.fallTimePlaceholder')}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          {level === 'highschool' && (
            <>
              <Text style={styles.label}>{t('run.parachute.contactTime')}</Text>
              <TextInput
                value={trial.contactTime}
                onChangeText={(v) => onUpdate({ contactTime: v })}
                placeholder={t('run.parachute.contactTimePlaceholder')}
                keyboardType="decimal-pad"
                style={styles.input}
              />

              <View style={styles.bounceRow}>
                <Text style={styles.label}>{t('run.parachute.didBounce')}</Text>
                <Switch
                  value={trial.didBounce}
                  onValueChange={(v) => onUpdate({ didBounce: v })}
                />
              </View>

              {trial.didBounce && (
                <>
                  <Text style={styles.label}>{t('run.parachute.bounceTime')}</Text>
                  <TextInput
                    value={trial.bounceTime}
                    onChangeText={(v) => onUpdate({ bounceTime: v })}
                    placeholder={t('run.parachute.bounceTimePlaceholder')}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </>
              )}
            </>
          )}

          <Pressable onPress={onCalculate} style={styles.calcBtn}>
            <Text style={styles.calcBtnText}>{t('run.parachute.calculate')}</Text>
          </Pressable>
        </View>
      )}

      {isDone && trial.result && (
        <View style={styles.resultGrid}>
          <StatCard
            label={t('run.parachute.velocity')}
            value={t('run.parachute.velocityUnit', { value: trial.result.finalVelocity })}
          />
          {level === 'highschool' && (
            <>
              <StatCard
                label={t('run.parachute.acceleration')}
                value={t('run.parachute.accelerationUnit', { value: trial.result.acceleration })}
              />
              <StatCard
                label={t('run.parachute.netForce')}
                value={t('run.parachute.forceUnit', { value: trial.result.netForce })}
              />
              <StatCard
                label={t('run.parachute.dragForce')}
                value={t('run.parachute.forceUnit', { value: trial.result.dragForce })}
              />
            </>
          )}
          {level === 'highschool' && trial.result.gForce > 0 && (
            <GForceBadge gForce={trial.result.gForce} />
          )}
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

function GForceBadge({ gForce }: { gForce: number }) {
  const risk = getGForceRisk(gForce);
  return (
    <View style={[styles.gForceBadge, { backgroundColor: risk.bgColor, borderColor: risk.color }]}>
      <View>
        <Text style={[styles.gForceValue, { color: risk.color }]}>{gForce}g</Text>
        <Text style={[styles.gForceLabel, { color: risk.color }]}>G-Force</Text>
      </View>
      <View style={styles.gForceInfo}>
        <Text style={[styles.gForceRisk, { color: risk.color }]}>{risk.label}</Text>
        <Text style={[styles.gForceExample, { color: risk.color }]}>{risk.example}</Text>
      </View>
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
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
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
  bounceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
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
    flexBasis: '45%',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  gForceBadge: {
    flexBasis: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  gForceValue: { fontSize: 20, fontWeight: '800' },
  gForceLabel: { fontSize: 10 },
  gForceInfo: { flex: 1 },
  gForceRisk: { fontSize: 12, fontWeight: '600' },
  gForceExample: { fontSize: 11, marginTop: 2 },
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
