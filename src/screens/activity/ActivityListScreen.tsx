import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { activities } from '../../data/activities';
import { Activity } from '../../types/Activity';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityList'>;

// Display order for available activities (top section).
const AVAILABLE_ORDER: string[] = [
  'parachute',
  'sound',
  'handfan',
  'earthquake',
  'performance',
  'reaction',
  'breathing'
];
// const AVAILABLE_ORDER: string[] = ['parachute', 'sound', 'handfan', 'earthquake', 'performance', 'reaction'];

type Section = { titleKey: string; data: Activity[] };

export default function ActivityListScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  const sections = useMemo<Section[]>(() => {
    const byId = new Map(activities.map((a) => [a.id, a]));
    const available = AVAILABLE_ORDER
      .map((id) => byId.get(id))
      .filter((a): a is Activity => a !== undefined)
      .filter((a) => !a.comingSoon);
    const comingSoon = activities.filter((a) => a.comingSoon);
    const result: Section[] = [];
    if (available.length) {
      result.push({ titleKey: 'home.availableActivities', data: available });
    }
    if (comingSoon.length) {
      result.push({ titleKey: 'home.comingSoon', data: comingSoon });
    }
    return result;
  }, []);

  const handlePress = (activity: Activity) => {
    if (activity.comingSoon) return;
    navigation.navigate('ActivityDetail', { activityId: activity.id });
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('home.subheading')}
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              styles.sectionHeader,
              {
                color: colors.text,
                fontSize: baseFont.bodyLg * fontScale,
              },
            ]}
          >
            {t(section.titleKey)}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            disabled={item.comingSoon}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              item.comingSoon && styles.cardDisabled,
              pressed && !item.comingSoon && { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.category,
                  { color: colors.primary, fontSize: baseFont.tiny * fontScale },
                ]}
              >
                {t(`category.${item.category}`)}
              </Text>
              {item.comingSoon && (
                <Text
                  style={[
                    styles.badge,
                    {
                      color: colors.warning,
                      backgroundColor: colors.warningBg,
                      fontSize: baseFont.micro * fontScale,
                    },
                  ]}
                >
                  {t('home.comingSoon')}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.text, fontSize: baseFont.bodyLg * fontScale },
              ]}
            >
              {t(`activity.${item.id}.title`)}
            </Text>
            <Text
              style={[
                styles.domain,
                { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
              ]}
            >
              {t(`activity.${item.id}.domain`)}
            </Text>
            <Text
              style={[
                styles.description,
                { color: colors.text, fontSize: baseFont.bodySm * fontScale },
              ]}
            >
              {t(`activity.${item.id}.shortDescription`)}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  subheading: { marginBottom: 12 },
  list: { paddingBottom: 24 },
  sectionHeader: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardDisabled: { opacity: 0.55 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  title: { fontWeight: '600', marginBottom: 2 },
  domain: { marginBottom: 6 },
  description: {},
});
