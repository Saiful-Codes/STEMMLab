import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import {
  ActivityAttempt,
  ParachuteEntry,
  ParachuteMeta,
  loadAttempts,
} from '../../../storage/attempts';
import { getGForceRisk } from '../../../utils/parachutePhysics';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { baseFont, Colors } from '../../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function ParachuteResultScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<ActivityAttempt<ParachuteEntry> | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const attempts = await loadAttempts<ParachuteEntry>(activityId);
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

  const meta = latest.meta as ParachuteMeta | undefined;
  const level = meta?.studentLevel ?? 'primary';
  const entries = latest.entries;

  const baseline = entries.find((e) => e.trialNumber === 1);
  const parachuteEntries = entries.filter((e) => e.trialNumber > 1);
  const bestParachute = parachuteEntries.reduce((best, e) =>
    e.result.finalVelocity < best.result.finalVelocity ? e : best,
  );

  const improvement =
    baseline && bestParachute
      ? Math.round(
          ((baseline.result.finalVelocity - bestParachute.result.finalVelocity) /
            baseline.result.finalVelocity) *
            100,
        )
      : 0;

  const trialLabels = [
    t('result.parachute.baseline'),
    t('result.parachute.design1'),
    t('result.parachute.design2'),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('run.parachute.heading')}</Text>
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
        <Text style={styles.heroLabel}>{t('result.parachute.bestSpeed')}</Text>
        <Text style={styles.heroValue}>{bestParachute.result.finalVelocity} m/s</Text>
        <Text style={styles.heroSub}>
          {t('result.parachute.improvement', { percent: improvement })}
        </Text>
      </View>

      {/* Comparison Table */}
      <Text style={styles.sectionTitle}>{t('result.parachute.comparison')}</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.tableCellLabel, styles.headerText]}>
            {t('result.parachute.trial')}
          </Text>
          {trialLabels.map((label) => (
            <Text
              key={label}
              style={[styles.tableCell, styles.headerText]}
            >
              {label}
            </Text>
          ))}
        </View>

        <TableRow
          label={level === 'primary' ? t('result.parachute.speed') : t('run.parachute.velocity')}
          values={entries.map((e) => `${e.result.finalVelocity} m/s`)}
          bestIndex={entries.indexOf(bestParachute)}
          styles={styles}
        />

        {level === 'primary' && (
          <TableRow
            label={t('result.parachute.fallTimeLabel')}
            values={entries.map((e) => `${e.input.fallTime}s`)}
            styles={styles}
          />
        )}

        {level === 'highschool' && (
          <>
            <TableRow
              label={t('run.parachute.acceleration')}
              values={entries.map((e) => `${e.result.acceleration} m/s²`)}
              styles={styles}
            />
            <TableRow
              label={t('run.parachute.netForce')}
              values={entries.map((e) => `${e.result.netForce} N`)}
              styles={styles}
            />
            <TableRow
              label={t('run.parachute.dragForce')}
              values={entries.map((e) => `${e.result.dragForce} N`)}
              styles={styles}
            />
            <GForceRow
              label={t('run.parachute.gForce')}
              entries={entries}
              styles={styles}
            />
          </>
        )}
      </View>

      {level === 'highschool' && (
        <>
          <Text style={styles.sectionTitle}>
            {t('result.parachute.gForceAssessment')}
          </Text>
          <View style={styles.assessmentRow}>
            {entries.map((entry, i) => {
              const risk = getGForceRisk(entry.result.gForce);
              return (
                <View
                  key={i}
                  style={[
                    styles.assessmentCard,
                    { backgroundColor: risk.bgColor, borderColor: risk.color },
                  ]}
                >
                  <Text style={[styles.assessmentValue, { color: risk.color }]}>
                    {entry.result.gForce}g
                  </Text>
                  <Text style={[styles.assessmentLabel, { color: risk.color }]}>
                    {trialLabels[i]}
                  </Text>
                  <Text style={[styles.assessmentExample, { color: risk.color }]}>
                    {risk.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button
          title={t('summary.save')}
          onPress={() =>
            navigation.replace('ResultSummary', {
              activityId,
              result: bestParachute.result.finalVelocity,
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

function GForceRow({
  label,
  entries,
  styles,
}: {
  label: string;
  entries: ParachuteEntry[];
  styles: Styles;
}) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellLabel]}>{label}</Text>
      {entries.map((e, i) => {
        const risk = getGForceRisk(e.result.gForce);
        return (
          <View key={i} style={[styles.tableCell, { justifyContent: 'center', alignItems: 'center' }]}>
            <View
              style={[styles.gBadgeSmall, { backgroundColor: risk.bgColor }]}
            >
              <Text style={[styles.gBadgeSmallText, { color: risk.color }]}>
                {e.result.gForce}g
              </Text>
            </View>
          </View>
        );
      })}
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    tableCellLabel: { flex: 2, textAlign: 'left', color: colors.textMuted, fontWeight: '500' },
    tableCellBest: { color: colors.success, fontWeight: '600' },
    gBadgeSmall: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    gBadgeSmallText: { fontSize: baseFont.micro * fontScale, fontWeight: '600' },
    assessmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    assessmentCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    assessmentValue: { fontSize: baseFont.body * fontScale, fontWeight: '800' },
    assessmentLabel: { fontSize: 10 * fontScale, fontWeight: '600', marginTop: 2 },
    assessmentExample: { fontSize: 10 * fontScale, marginTop: 2, textAlign: 'center' },
    actions: { marginTop: 12 },
  });
