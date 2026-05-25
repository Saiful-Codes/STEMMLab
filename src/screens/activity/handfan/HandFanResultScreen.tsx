import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  ActivityAttempt,
  HandFanEntry,
  HandFanMeta,
  loadAttempts,
} from '../../../storage/attempts';
import { getMaterial } from '../../../utils/handFanPhysics';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function HandFanResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<HandFanEntry> | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [scienceOpen, setScienceOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<HandFanEntry>(activityId);
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
        <ActivityIndicator />
      </View>
    );
  }

  if (!latest) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('result.common.empty')}</Text>
      </View>
    );
  }

  const meta = latest.meta as HandFanMeta | undefined;
  const entries = latest.entries;
  const material = meta ? getMaterial(meta.materialType) : undefined;

  const bestEntry = entries.reduce((best, e) =>
    e.input.actualAngle > best.input.actualAngle ? e : best,
  );
  const bestIndex = entries.indexOf(bestEntry);
  const bestAngle = bestEntry.input.actualAngle;

  const trialLabels = entries.map((e) => e.trialLabel);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.handfan.heading')}</Text>
      <Text style={styles.meta}>
        {t('result.common.savedAt', {
          when: new Date(latest.finishedAt).toLocaleString(),
        })}
      </Text>
      <Text style={styles.meta}>
        {t('result.common.totalAttempts', { count: totalAttempts })}
      </Text>

      {/* Hero Card */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{t('result.handfan.bestAngle')}</Text>
        <Text style={styles.heroValue}>{bestAngle}°</Text>
        <Text style={styles.heroSub}>
          {t('result.handfan.bestDesign', { name: bestEntry.input.designName })}
        </Text>
      </View>

      {/* Meta Info */}
      {meta && material && (
        <Text style={styles.metaLine}>
          {t('result.handfan.metaLine', {
            material: material.label,
            distance: meta.distance,
          })}
        </Text>
      )}

      {/* Comparison Table */}
      <Text style={styles.sectionTitle}>{t('result.handfan.comparison')}</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.tableCellLabel, styles.headerText]}>
            {' '}
          </Text>
          {trialLabels.map((label) => (
            <Text key={label} style={[styles.tableCell, styles.headerText]}>
              {label}
            </Text>
          ))}
        </View>

        <TableRow
          label={t('result.handfan.designNameRow')}
          values={entries.map((e) => e.input.designName)}
          styles={styles}
        />
        <TableRow
          label={t('result.handfan.predictedRow')}
          values={entries.map((e) => `${e.input.predictedAngle}°`)}
          styles={styles}
        />
        <TableRow
          label={t('result.handfan.actualRow')}
          values={entries.map((e) => `${e.input.actualAngle}°`)}
          bestIndex={bestIndex}
          styles={styles}
        />
        <TableRow
          label={t('result.handfan.differenceRow')}
          values={entries.map(
            (e) => `${(e.input.actualAngle - e.input.predictedAngle) >= 0 ? '+' : ''}${(e.input.actualAngle - e.input.predictedAngle).toFixed(1)}°`,
          )}
          styles={styles}
        />
      </View>

      {/* Science Deep Dive */}
      <Pressable
        onPress={() => setScienceOpen(!scienceOpen)}
        style={styles.scienceHeader}
      >
        <Text style={styles.sectionTitle}>{t('result.handfan.scienceTitle')}</Text>
        <Text style={styles.chevron}>{scienceOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {scienceOpen && material && (
        <View style={styles.scienceBody}>
          <Text style={styles.scienceExplain}>
            {t('result.handfan.forceExplanation')}
          </Text>

          {entries.map((entry, i) => (
            <View key={i} style={styles.scienceCard}>
              <Text style={styles.scienceDesign}>{entry.trialLabel}</Text>
              <Text style={styles.scienceDetail}>
                {t('result.handfan.stiffness', { value: material.stiffness })}
              </Text>
              <Text style={styles.scienceDetail}>
                {t('result.handfan.angleConversion', {
                  degrees: entry.input.actualAngle,
                  radians: entry.result.bendAngleRad,
                })}
              </Text>
              <Text style={styles.scienceForce}>
                {t('result.handfan.forceCalc', {
                  k: material.stiffness,
                  rad: entry.result.bendAngleRad,
                  force: entry.result.estimatedForce,
                })}
              </Text>
            </View>
          ))}

          {/* Force Comparison Row */}
          <View style={styles.forceRow}>
            {entries.map((entry, i) => {
              const isBest = i === bestIndex;
              return (
                <View
                  key={i}
                  style={[styles.forceCard, isBest && styles.forceCardBest]}
                >
                  <Text style={[styles.forceValue, isBest && styles.forceValueBest]}>
                    {entry.result.estimatedForce} N
                  </Text>
                  <Text style={styles.forceLabel}>{entry.trialLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title={t('summary.save')}
          onPress={() =>
            navigation.replace('ResultSummary', {
              activityId,
              result: bestAngle,
            })
          }
        />
      </View>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof makeStyles>;

type TableRowProps = {
  label: string;
  values: string[];
  bestIndex?: number;
  styles: Styles;
};

function TableRow({ label, values, bestIndex, styles }: TableRowProps) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellLabel]}>{label}</Text>
      {values.map((v, i) => (
        <Text
          key={i}
          style={[
            styles.tableCell,
            i === bestIndex && styles.tableCellBest,
          ]}
        >
          {v}
        </Text>
      ))}
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
    empty: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted },
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    meta: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 2 },
    metaLine: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginBottom: 12,
    },
    hero: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
    },
    heroLabel: { fontSize: baseFont.micro * fontScale, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
    heroValue: { fontSize: baseFont.display * fontScale, fontWeight: '800', color: '#fff', marginTop: 4 },
    heroSub: { fontSize: baseFont.tiny * fontScale, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    sectionTitle: { fontSize: baseFont.bodySm * fontScale, fontWeight: '700', color: colors.text, marginBottom: 8 },
    table: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 16,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableHeader: { backgroundColor: colors.surfaceSubtle },
    headerText: { fontSize: baseFont.micro * fontScale, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
    tableCell: {
      flex: 1,
      padding: 8,
      fontSize: baseFont.tiny * fontScale,
      color: colors.text,
      textAlign: 'center',
    },
    tableCellLabel: { flex: 2, textAlign: 'left', color: colors.textMuted, fontWeight: '500' },
    tableCellBest: { color: colors.success, fontWeight: '600' },
    scienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    chevron: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted },
    scienceBody: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    scienceExplain: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
    scienceCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scienceDesign: { fontSize: baseFont.small * fontScale, fontWeight: '700', color: colors.text, marginBottom: 4 },
    scienceDetail: { fontSize: baseFont.micro * fontScale, color: colors.textMuted, marginBottom: 2 },
    scienceForce: { fontSize: baseFont.tiny * fontScale, fontWeight: '600', color: colors.primary, marginTop: 4 },
    forceRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    forceCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    forceCardBest: { borderColor: colors.success, borderWidth: 2 },
    forceValue: { fontSize: baseFont.bodySm * fontScale, fontWeight: '700', color: colors.text },
    forceValueBest: { color: colors.success },
    forceLabel: { fontSize: 10 * fontScale, color: colors.textMuted, marginTop: 2 },
    actions: { marginTop: 12 },
  });
