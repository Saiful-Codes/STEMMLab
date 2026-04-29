import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { activities } from '../../data/activities';
import { useTheme } from '../../context/ThemeContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityDetail'>;

const IMPLEMENTED_ACTIVITY_IDS = ['sound', 'reaction', 'earthquake'];

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { colors, fontScale } = useTheme();
  const activity = activities.find((a) => a.id === activityId);

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: baseFont.heading * fontScale },
          ]}
        >
          Activity not found
        </Text>
      </View>
    );
  }

  const isImplemented = IMPLEMENTED_ACTIVITY_IDS.includes(activity.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.category,
          { color: colors.primary, fontSize: baseFont.tiny * fontScale },
        ]}
      >
        {activity.category}
      </Text>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        {activity.title}
      </Text>
      <Text
        style={[
          styles.domain,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {activity.domain}
      </Text>
      <Text
        style={[
          styles.description,
          { color: colors.text, fontSize: baseFont.body * fontScale },
        ]}
      >
        {activity.shortDescription}
      </Text>

      <View style={styles.actions}>
        {isImplemented ? (
          <Pressable
            onPress={() =>
              navigation.navigate('ActivityRun', { activityId: activity.id })
            }
            style={({ pressed }) => [
              styles.startBtn,
              {
                backgroundColor: pressed
                  ? colors.primaryPressed
                  : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.startBtnText,
                {
                  color: colors.primaryText,
                  fontSize: baseFont.body * fontScale,
                },
              ]}
            >
              Start Activity
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.notice,
              {
                color: colors.warning,
                fontSize: baseFont.bodySm * fontScale,
              },
            ]}
          >
            This activity will be added in a later phase.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  category: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: { fontWeight: '700', marginBottom: 4 },
  domain: { marginBottom: 16 },
  description: { lineHeight: 22 },
  actions: { marginTop: 32 },
  startBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  startBtnText: { fontWeight: '700' },
  notice: { textAlign: 'center' },
});
