import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../context/ThemeContext';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        Welcome to STEMM Lab
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: colors.textMuted, fontSize: baseFont.body * fontScale },
        ]}
      >
        Real-world STEMM activities, gamified.
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
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 24, textAlign: 'center' },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  btnText: { fontWeight: '700' },
});
