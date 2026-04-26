import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { activities } from '../../data/activities';
import { Activity } from '../../types/Activity';
import { ActivityStackParamList } from '../../navigation/ActivityStack';

type Props = NativeStackScreenProps<ActivityStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const handlePress = (activity: Activity) => {
    if (activity.comingSoon) return;
    navigation.navigate('ActivityDetail', { activityId: activity.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Activities</Text>
      <Text style={styles.subheading}>Pick a STEMM challenge to start.</Text>

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
              item.comingSoon && styles.cardDisabled,
              pressed && !item.comingSoon && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{item.category}</Text>
              {item.comingSoon && (
                <Text style={styles.badge}>Coming Soon</Text>
              )}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.domain}>{item.domain}</Text>
            <Text style={styles.description}>{item.shortDescription}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontSize: 24, fontWeight: '600' },
  subheading: { fontSize: 14, color: '#555', marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardPressed: { backgroundColor: '#f3f4f6' },
  cardDisabled: { opacity: 0.55 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  domain: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  description: { fontSize: 14, color: '#374151' },
});
