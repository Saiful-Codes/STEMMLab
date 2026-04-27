import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import SoundRunScreen from './sound/SoundRunScreen';
import ReactionRunScreen from './reaction/ReactionRunScreen';
import EarthquakeRunScreen from './earthquake/EarthquakeRunScreen';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

export default function ActivityRunScreen(props: Props) {
  const { activityId } = props.route.params;

  switch (activityId) {
    case 'sound':
      return <SoundRunScreen {...props} />;
    case 'reaction':
      return <ReactionRunScreen {...props} />;
    case 'earthquake':
      return <EarthquakeRunScreen {...props} />;
    default:
      return (
        <View style={styles.center}>
          <Text style={styles.text}>This activity is not playable yet.</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
