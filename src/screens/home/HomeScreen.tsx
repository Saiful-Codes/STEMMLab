import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { activities } from '../../data/activities';
import { Activity } from '../../types/Activity';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  const handlePress = (activity: Activity) => {
    if (activity.comingSoon) return;
    navigation.navigate('ActivityDetail', { activityId: activity.id });
  };

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
        {t('home.heading')}
      </Text>
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('home.subheading')}
      </Text>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontWeight: '600' },
  subheading: { marginBottom: 12 },
  list: { paddingBottom: 24 },
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
