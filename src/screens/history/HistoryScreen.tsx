import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Result } from '../../types/Result';
import { getResults } from '../../storage/results';
import {
  formatResult,
  formatTimestamp,
  getActivityShortLabelKey,
  getActivityTitleKey,
  RANKED_ACTIVITY_IDS,
} from '../../utils/activityLabels';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';
import PerformanceChart from '../../components/PerformanceChart';

type Filter = 'all' | string;

export default function HistoryScreen() {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();
  const [results, setResults] = useState<Result[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(false);
        try {
          const stored = await getResults();
          if (!cancelled) setResults(stored);
        } catch {
          if (!cancelled) setError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const filterChips: { id: Filter; label: string }[] = [
    { id: 'all', label: t('history.filter.all') },
    ...RANKED_ACTIVITY_IDS.map((id) => ({
      id,
      label: t(getActivityShortLabelKey(id)),
    })),
  ];

  const filtered =
    filter === 'all' ? results : results.filter((r) => r.activityId === filter);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text
        style={[
          styles.heading,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        {t('history.heading')}
      </Text>
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('history.subheading')}
      </Text>

      <View style={styles.filterRow}>
        {filterChips.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.borderStrong,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active ? colors.primaryText : colors.text,
                    fontWeight: active ? '600' : '400',
                    fontSize: baseFont.small * fontScale,
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          colors={colors}
          fontScale={fontScale}
          title={t('history.error.title')}
          message={t('history.error.message')}
        />
      ) : (
        <>
          <PerformanceChart results={results} activeFilter={filter} />
          {filtered.length === 0 ? (
            <EmptyState
              colors={colors}
              fontScale={fontScale}
              title={
                results.length === 0
                  ? t('history.empty.noResultsTitle')
                  : t('history.empty.noFilteredTitle')
              }
              message={
                results.length === 0
                  ? t('history.empty.noResultsMessage')
                  : t('history.empty.noFilteredMessage')
              }
            />
          ) : (
            <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.activityName,
                    { color: colors.text, fontSize: baseFont.bodySm * fontScale },
                  ]}
                >
                  {t(getActivityTitleKey(item.activityId))}
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    { color: colors.primary, fontSize: baseFont.body * fontScale },
                  ]}
                >
                  {formatResult(item.activityId, item.result)}
                </Text>
              </View>
              <Text
                style={[
                  styles.meta,
                  { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
                ]}
              >
                {item.teamName} · {formatTimestamp(item.timestamp)}
              </Text>
              {item.rating ? (
                <Text
                  style={[
                    styles.rating,
                    { color: colors.star, fontSize: baseFont.bodySm * fontScale },
                  ]}
                >
                  {'★'.repeat(item.rating)}
                  <Text style={{ color: colors.starDim }}>
                    {'★'.repeat(5 - item.rating)}
                  </Text>
                </Text>
              ) : null}
                            {item.comment ? (
                <Text
                  style={[
                    styles.comment,
                    { color: colors.text, fontSize: baseFont.small * fontScale },
                  ]}
                >
                  “{item.comment}”
                </Text>
              ) : null}
              {item.locationName || (item.latitude != null && item.longitude != null) ? (
                <Text
                  style={[
                    styles.location,
                    { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
                  ]}
                >
                  📍 {item.locationName || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                </Text>
              ) : null}
            </View>
          )}
        />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function EmptyState({
  colors,
  fontScale,
  title,
  message,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  fontScale: number;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyBadge,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.emptyBadgeText,
            { color: colors.textMuted, fontSize: baseFont.heading * fontScale },
          ]}
        >
          —
        </Text>
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.text, fontSize: baseFont.bodyLg * fontScale },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.emptyMessage,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontWeight: '700' },
  subheading: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {},
  list: { paddingBottom: 24 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: { fontWeight: '600', flex: 1, paddingRight: 8 },
  resultValue: { fontWeight: '700' },
  meta: {},
  rating: { marginTop: 6 },
  comment: { fontStyle: 'italic', marginTop: 6 },
  location: { marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyBadgeText: { fontWeight: '700' },
  emptyTitle: { fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  emptyMessage: { textAlign: 'center' },
});
