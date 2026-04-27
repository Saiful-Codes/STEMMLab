import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import SoundResultScreen from './sound/SoundResultScreen';
import ReactionResultScreen from './reaction/ReactionResultScreen';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function ActivityResultScreen(props: Props) {
  const { activityId } = props.route.params;

  switch (activityId) {
    case 'sound':
      return <SoundResultScreen {...props} />;
    case 'reaction':
      return <ReactionResultScreen {...props} />;
    default:
      return (
        <View style={styles.center}>
          <Text style={styles.text}>No results to show for this activity.</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
