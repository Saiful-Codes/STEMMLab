import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import SoundResultScreen from './sound/SoundResultScreen';
import ReactionResultScreen from './reaction/ReactionResultScreen';
import EarthquakeResultScreen from './earthquake/EarthquakeResultScreen';
import ParachuteResultScreen from './parachute/ParachuteResultScreen';
import HandFanResultScreen from './handfan/HandFanResultScreen';
import BreathingResultScreen from './breathing/BreathingResultScreen';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityResult'>;

export default function ActivityResultScreen(props: Props) {
  const { activityId } = props.route.params;

  switch (activityId) {
    case 'sound':
      return <SoundResultScreen {...props} />;
    case 'reaction':
      return <ReactionResultScreen {...props} />;
    case 'earthquake':
      return <EarthquakeResultScreen {...props} />;
    case 'parachute':
      return <ParachuteResultScreen {...props} />;
    case 'handfan':
      return <HandFanResultScreen {...props} />;
    case 'breathing':
      return <BreathingResultScreen {...props} />;
    default:
      return <NoResults />;
  }
}

function NoResults() {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.text,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('activityResult.none')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center' },
});
