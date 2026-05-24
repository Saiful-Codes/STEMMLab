import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
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
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';
import { useLocation } from '../../../context/LocationContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useTeam } from '../../../context/TeamContext';
import { saveActivityResultWithLocation } from '../../../utils/activityResultHelper';
import type { Result } from '../../../types/Result';

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
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const { team } = useTeam();
  const { location, refreshLocation } = useLocation();
  const { sendAchievement } = useNotifications();

  const [materialType, setMaterialType] = useState(MATERIALS[0].key);
  const [distance, setDistance] = useState(DISTANCES[1]);
  const [trials, setTrials] = useState<TrialState[]>([
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
    { ...EMPTY_TRIAL },
  ]);
  const [expandedTrial, setExpandedTrial] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Get location when screen mounts
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

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

    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    setIsFinishing(true);

    try {
      // Refresh location before finishing
      await refreshLocation();

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

      // Save result with GPS location
      const bestAngle = Math.max(...entries.map((e) => e.result.bendAngleRad));
      const result: Result = {
        id: `result_${Date.now()}`,
        activityId,
        teamName: team.name,
        members: team.members,
        result: bestAngle,
        timestamp: Date.now(),
      };

      await saveActivityResultWithLocation(result, location);

      // Send completion notification
      await sendAchievement(
        'Hand Fan Challenge Complete! 💨',
        `${team.name} tested air movement designs${location?.locationName ? ` at ${location.locationName}` : ''}`
      );

      Alert.alert(
  'Activity Saved!',
  `GPS location captured:\n${location?.locationName || 'Unknown location'}`
);


      navigation.replace('ActivityResult', { activityId });
    } catch (err) {
      console.error('Error finishing activity:', err);
      Alert.alert('Error', 'Failed to save activity result');
    } finally {
      setIsFinishing(false);
    }
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
          styles={styles}
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

type Styles = ReturnType<typeof makeStyles>;

type TrialCardProps = {
  index: number;
  trial: TrialState;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<TrialState>) => void;
  onRecord: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  styles: Styles;
};

function TrialCard({
  index,
  trial,
  expanded,
  onToggle,
  onUpdate,
  onRecord,
  t,
  styles,
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
            styles={styles}
          />
          <StatCard
            label={t('run.handfan.actualAngle')}
            value={`${trial.actualAngle}°`}
            styles={styles}
          />
          <StatCard
            label={t('result.handfan.differenceRow')}
            value={`${(parseFloat(trial.actualAngle) - parseFloat(trial.predictedAngle)).toFixed(1)}°`}
            styles={styles}
          />
        </View>
      )}
    </View>
  );
}

function StatCard({
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
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    subheading: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted, marginBottom: 16 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardDone: { borderColor: colors.success, borderWidth: 2 },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardHeaderLeft: { flex: 1 },
    cardTitle: { fontSize: baseFont.bodySm * fontScale, fontWeight: '700', color: colors.text },
    cardSub: { fontSize: baseFont.micro * fontScale, color: colors.textSubtle, marginTop: 2 },
    cardBody: { marginTop: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    badgePending: { backgroundColor: colors.warningBg },
    badgeDone: { backgroundColor: colors.successBg },
    badgeText: { fontSize: baseFont.micro * fontScale, fontWeight: '600' },
    badgeTextPending: { color: colors.accent },
    badgeTextDone: { color: colors.success },
    label: {
      fontSize: baseFont.tiny * fontScale,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 4,
      marginTop: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontSize: baseFont.bodySm * fontScale,
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
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
    },
    materialBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    materialBtnText: { fontSize: baseFont.tiny * fontScale, fontWeight: '600', color: colors.textMuted },
    materialBtnTextActive: { color: colors.primaryText },
    toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleText: { fontSize: baseFont.small * fontScale, fontWeight: '600', color: colors.textMuted },
    toggleTextActive: { color: colors.primaryText },
    calcBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    calcBtnText: { color: colors.primaryText, fontSize: baseFont.small * fontScale, fontWeight: '600' },
    resultGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    stat: {
      flexGrow: 1,
      flexBasis: '30%',
      backgroundColor: colors.surfaceMuted,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    statValue: { fontSize: baseFont.body * fontScale, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: baseFont.micro * fontScale, color: colors.textMuted, marginTop: 2 },
    finishBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    finishBtnDisabled: { backgroundColor: colors.borderStrong },
    finishBtnText: { color: colors.primaryText, fontSize: baseFont.bodySm * fontScale, fontWeight: '700' },
    finishHint: {
      fontSize: baseFont.micro * fontScale,
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: 6,
    },
  });
