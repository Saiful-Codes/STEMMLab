import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { MainTabsParamList } from '../../navigation/MainTabs';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';
import { Result } from '../../types/Result';
import { getResults } from '../../storage/results';
import QuickAccessCard from '../../components/QuickAccessCard';
import RecentActivityCard from '../../components/RecentActivityCard';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ActivityStackParamList, 'Dashboard'>,
  BottomTabScreenProps<MainTabsParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();
  const { team } = useTeam();
  const { t } = useTranslation();
  const [latestResult, setLatestResult] = useState<Result | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const stored = await getResults();
        if (!cancelled) setLatestResult(stored[0] ?? null);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const goToActivities = () => navigation.navigate('ActivityList');
  const goToLeaderboard = () => navigation.navigate('Leaderboard');
  const goToHistory = () => navigation.navigate('History');
  const goToSettings = () => navigation.navigate('Settings');

  const teamName = team?.name?.trim() || t('home.yourTeam');

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text
            style={[
              styles.welcome,
              { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {t('home.welcomeBack')}
          </Text>
          <View style={[styles.teamBanner, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                styles.teamName,
                {
                  color: colors.primaryText,
                  fontSize: baseFont.heading * fontScale,
                },
              ]}
              numberOfLines={1}
            >
              {teamName}
            </Text>
          </View>
        </View>

        {/* QUICK ACCESS */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontSize: baseFont.subheading * fontScale },
          ]}
        >
          {t('home.quickAccess')}
        </Text>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <QuickAccessCard
              icon="🧪"
              label={t('home.heading')}
              iconBg={colors.primarySoft}
              iconColor={colors.primary}
              onPress={goToActivities}
            />
            <View style={styles.gridGap} />
            <QuickAccessCard
              icon="🏆"
              label={t('tab.leaderboard')}
              iconBg={colors.warningBg}
              iconColor={colors.warning}
              onPress={goToLeaderboard}
            />
          </View>
          <View style={styles.gridRowSpacer} />
          <View style={styles.gridRow}>
            <QuickAccessCard
              icon="📊"
              label={t('tab.history')}
              iconBg={colors.dangerSoft}
              iconColor={colors.dangerText}
              onPress={goToHistory}
            />
            <View style={styles.gridGap} />
            <QuickAccessCard
              icon="⚙️"
              label={t('tab.settings')}
              iconBg={colors.surfaceMuted}
              iconColor={colors.text}
              onPress={goToSettings}
            />
          </View>
        </View>

        {/* RECENT ACTIVITY */}
        <Text
          style={[
            styles.sectionTitle,
            styles.sectionTitleSpaced,
            { color: colors.text, fontSize: baseFont.subheading * fontScale },
          ]}
        >
          {t('home.recentActivity')}
        </Text>
        <RecentActivityCard result={latestResult} />

        {/* FOOTER HINT */}
        <Text
          style={[
            styles.footerHint,
            { color: colors.textSubtle, fontSize: baseFont.tiny * fontScale },
          ]}
        >
          {t('home.tapHint')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  welcome: { marginBottom: 8 },
  teamBanner: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: '100%',
  },
  teamName: { fontWeight: '800', letterSpacing: 0.2 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  sectionTitleSpaced: { marginTop: 28 },
  grid: {},
  gridRow: { flexDirection: 'row' },
  gridGap: { width: 12 },
  gridRowSpacer: { height: 12 },
  footerHint: {
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '500',
  },
});
