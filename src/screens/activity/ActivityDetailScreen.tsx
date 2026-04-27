import { Button, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { activities } from '../../data/activities';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityDetail'>;

const IMPLEMENTED_ACTIVITY_IDS = ['sound', 'reaction', 'earthquake'];

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const activity = activities.find((a) => a.id === activityId);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Activity not found</Text>
      </View>
    );
  }

  const isImplemented = IMPLEMENTED_ACTIVITY_IDS.includes(activity.id);

  return (
    <View style={styles.container}>
      <Text style={styles.category}>{activity.category}</Text>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.domain}>{activity.domain}</Text>
      <Text style={styles.description}>{activity.shortDescription}</Text>

      <View style={styles.actions}>
        {isImplemented ? (
          <Button
            title="Start Activity"
            onPress={() =>
              navigation.navigate('ActivityRun', { activityId: activity.id })
            }
          />
        ) : (
          <Text style={styles.notice}>
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
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  domain: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  description: { fontSize: 16, color: '#374151', lineHeight: 22 },
  actions: { marginTop: 32 },
  notice: { fontSize: 14, color: '#92400e', textAlign: 'center' },
});
