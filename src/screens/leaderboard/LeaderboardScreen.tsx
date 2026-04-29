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
  getActivityLabel,
  isLowerBetter,
  RANKED_ACTIVITY_IDS,
} from '../../utils/activityLabels';
import {
  averageResult,
  bestResult,
  sortResultsForRanking,
} from '../../utils/resultUtils';
import { useTheme } from '../../context/ThemeContext';
import { Colors, baseFont } from '../../theme/tokens';

const FILTERS = RANKED_ACTIVITY_IDS.map((id) => ({
  id,
  label: getActivityLabel(id).split(' ')[0],
}));

export default function LeaderboardScreen() {
  const { colors, fontScale } = useTheme();
  const [results, setResults] = useState<Result[]>([]);
  const [activityId, setActivityId] = useState<string>(RANKED_ACTIVITY_IDS[0]);
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

  const forActivity = results.filter((r) => r.activityId === activityId);
  const ranked = sortResultsForRanking(forActivity, activityId);
  const total = forActivity.length;
  const best = bestResult(forActivity, activityId);
  const avg = averageResult(forActivity, activityId);
  const lower = isLowerBetter(activityId);

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
        Leaderboard
      </Text>
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.small * fontScale },
        ]}
      >
        {lower ? 'Lower is better' : 'Higher is better'}
      </Text>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = activityId === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setActivityId(f.id)}
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

      <View style={styles.statsRow}>
        <StatCard
          label="Attempts"
          value={loading ? '…' : String(total)}
          colors={colors}
          fontScale={fontScale}
        />
        <StatCard
          label="Best"
          value={best === null ? '—' : formatResult(activityId, best)}
          colors={colors}
          fontScale={fontScale}
        />
        <StatCard
          label="Average"
          value={avg === null ? '—' : formatResult(activityId, avg)}
          colors={colors}
          fontScale={fontScale}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          colors={colors}
          fontScale={fontScale}
          title="Couldn't load leaderboard"
          message="Something went wrong reading saved results. Try again later."
        />
      ) : ranked.length === 0 ? (
        <EmptyState
          colors={colors}
          fontScale={fontScale}
          title="No data available"
          message="Finish an activity to see ranked results here."
        />
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.rank,
                  {
                    color: index < 3 ? colors.accent : colors.textSubtle,
                    fontSize: baseFont.bodyLg * fontScale,
                  },
                ]}
              >
                {index + 1}
              </Text>
              <View style={styles.rowMain}>
                <Text
                  style={[
                    styles.team,
                    { color: colors.text, fontSize: baseFont.bodySm * fontScale },
                  ]}
                >
                  {item.teamName}
                </Text>
                <Text
                  style={[
                    styles.rowMeta,
                    { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
                  ]}
                >
                  {getActivityLabel(item.activityId)} ·{' '}
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowResult,
                  { color: colors.primary, fontSize: baseFont.body * fontScale },
                ]}
              >
                {formatResult(item.activityId, item.result)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  colors,
  fontScale,
}: {
  label: string;
  value: string;
  colors: Colors;
  fontScale: number;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceMuted }]}>
      <Text
        style={[
          styles.statLabel,
          { color: colors.textMuted, fontSize: baseFont.micro * fontScale },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: colors.text, fontSize: baseFont.bodyLg * fontScale },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyState({
  colors,
  fontScale,
  title,
  message,
}: {
  colors: Colors;
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
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
  },
  statLabel: { textTransform: 'uppercase' },
  statValue: { fontWeight: '700', marginTop: 4 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  rank: { fontWeight: '700', width: 28 },
  rowMain: { flex: 1, paddingHorizontal: 8 },
  team: { fontWeight: '600' },
  rowMeta: { marginTop: 2 },
  rowResult: { fontWeight: '700' },
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
