import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        {t('welcome.title')}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: colors.textMuted, fontSize: baseFont.body * fontScale },
        ]}
      >
        {t('welcome.subtitle')}
      </Text>
      <Pressable
        onPress={() => navigation.navigate('TeamSetup')}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        ]}
      >
        <Text
          style={[
            styles.btnText,
            { color: colors.primaryText, fontSize: baseFont.body * fontScale },
          ]}
        >
          {t('welcome.continueOffline')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
        style={({ pressed }) => [
          styles.btnOutline,
          {
            borderColor: colors.primary,
            backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.btnText,
            { color: colors.primary, fontSize: baseFont.body * fontScale },
          ]}
        >
          {t('welcome.signIn')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
        style={({ pressed }) => [
          styles.btnOutline,
          {
            borderColor: colors.primary,
            backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.btnText,
            { color: colors.primary, fontSize: baseFont.body * fontScale },
          ]}
        >
          {t('welcome.createAccount')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 24, textAlign: 'center' },
  btn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  btnOutline: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  btnText: { fontWeight: '700' },
});
