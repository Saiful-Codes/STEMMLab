import { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Result } from '../types/Result';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import {
  RANKED_ACTIVITY_IDS,
  getActivityShortLabelKey,
  getActivityUnit,
} from '../utils/activityLabels';
import { baseFont } from '../theme/tokens';

const MAX_POINTS = 10;
const CHART_HEIGHT = 170;
const SCREEN_HORIZONTAL_PADDING = 16;
const CARD_PADDING = 12;
const Y_AXIS_RESERVED = 40;

type Props = {
  results: Result[];
  activeFilter: 'all' | string;
};

type BarPoint = { value: number; label: string };

export default function PerformanceChart({ results, activeFilter }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  const windowWidth = Dimensions.get('window').width;
  const cardInnerWidth = Math.max(
    220,
    windowWidth - SCREEN_HORIZONTAL_PADDING * 2 - CARD_PADDING * 2
  );

  const mode: 'attempts' | 'performance' =
    activeFilter === 'all' ? 'attempts' : 'performance';

  const { points, performanceActivityId } = useMemo(() => {
    if (mode === 'attempts') {
      const data: BarPoint[] = RANKED_ACTIVITY_IDS.map((id) => ({
        value: results.reduce(
          (n, r) => (r.activityId === id ? n + 1 : n),
          0
        ),
        label: t(getActivityShortLabelKey(id)),
      }));
      return { points: data, performanceActivityId: null as string | null };
    }
    const id = activeFilter;
    const data: BarPoint[] = results
      .filter((r) => r.activityId === id && typeof r.result === 'number')
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_POINTS)
      .map((r, i) => ({
        value: r.result as number,
        label: `${i + 1}`,
      }));
    return { points: data, performanceActivityId: id };
  }, [mode, activeFilter, results, t]);

  const hasData =
    mode === 'attempts' ? points.some((p) => p.value > 0) : points.length > 0;

  const subtitleText =
    mode === 'attempts'
      ? t('history.chart.subtitleAll')
      : performanceActivityId
        ? `${t(getActivityShortLabelKey(performanceActivityId))} · ${getActivityUnit(performanceActivityId)}`
        : '';

  const labelFontSize = Math.max(9, 10 * fontScale);

  const barWidth = mode === 'attempts' ? 56 : 18;
  const drawingWidth = cardInnerWidth - Y_AXIS_RESERVED;
  const totalBarWidth = points.length * barWidth;
  const computedSpacing =
    points.length > 0
      ? Math.max(8, (drawingWidth - totalBarWidth) / (points.length + 1))
      : 0;
  const initialSpacing = computedSpacing;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: baseFont.bodyLg * fontScale },
          ]}
        >
          {t('history.chart.title')}
        </Text>
        {hasData && subtitleText ? (
          <Text
            style={[
              styles.subtitle,
              { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
            ]}
          >
            {subtitleText}
          </Text>
        ) : null}
      </View>

      {!hasData ? (
        <Text
          style={[
            styles.empty,
            { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
          ]}
        >
          {t('history.chart.empty')}
        </Text>
      ) : (
        <View style={styles.chartWrap}>
          <BarChart
            data={points}
            barWidth={barWidth}
            spacing={computedSpacing}
            initialSpacing={initialSpacing}
            endSpacing={0}
            height={CHART_HEIGHT}
            parentWidth={cardInnerWidth}
            adjustToWidth
            barBorderRadius={4}
            frontColor={colors.primary}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            rulesColor={colors.border}
            noOfSections={4}
            isAnimated
            yAxisTextStyle={{ color: colors.textMuted, fontSize: labelFontSize }}
            xAxisLabelTextStyle={{
              color: colors.textMuted,
              fontSize: labelFontSize,
              textAlign: 'center',
            }}
            disablePress
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: CARD_PADDING,
    marginBottom: 12,
  },
  header: { marginBottom: 8 },
  title: { fontWeight: '700' },
  subtitle: { marginTop: 2 },
  empty: { paddingVertical: 24, textAlign: 'center' },
  chartWrap: { alignItems: 'center', overflow: 'hidden' },
});
