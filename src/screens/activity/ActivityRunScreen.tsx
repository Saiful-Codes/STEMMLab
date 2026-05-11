import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import SoundRunScreen from './sound/SoundRunScreen';
import ReactionRunScreen from './reaction/ReactionRunScreen';
import EarthquakeRunScreen from './earthquake/EarthquakeRunScreen';
import ParachuteRunScreen from './parachute/ParachuteRunScreen';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';

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
    case 'parachute':
      return <ParachuteRunScreen {...props} />;
    default:
      return <NotPlayable />;
  }
}

function NotPlayable() {
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
        {t('activityRun.notPlayable')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center' },
});
