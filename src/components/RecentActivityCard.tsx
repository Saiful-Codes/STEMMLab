import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { baseFont } from '../theme/tokens';
import { Result } from '../types/Result';
import {
  formatResult,
  formatTimestamp,
  getActivityTitleKey,
} from '../utils/activityLabels';

type Props = {
  result: Result | null;
};

export default function RecentActivityCard({ result }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  if (!result) {
    return (
      <View
        style={[
          styles.card,
          styles.emptyCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
        ]}
      >
        <Text
          style={[
            styles.emptyText,
            { color: colors.textMuted, fontSize: baseFont.body * fontScale },
          ]}
        >
          {t('home.noRecentActivity')}
        </Text>
      </View>
    );
  }

  const title = t(getActivityTitleKey(result.activityId));
  const score = formatResult(result.activityId, result.result);
  const dateLabel = formatTimestamp(result.timestamp);

  // Soft green pill — derived from theme so it adapts in dark mode.
  const pillBg = '#dcfce7';
  const pillText = '#166534';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: baseFont.bodyLg * fontScale },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {t('home.completedOn', { date: dateLabel })}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <Text
            style={[
              styles.pillText,
              { color: pillText, fontSize: baseFont.small * fontScale },
            ]}
          >
            {t('home.scorePill', { value: score })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 96,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyText: { fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textCol: { flex: 1, paddingRight: 12 },
  title: { fontWeight: '700', marginBottom: 6, lineHeight: 24 },
  subtitle: {},
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontWeight: '700' },
});
