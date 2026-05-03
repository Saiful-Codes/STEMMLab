import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { baseFont } from '../theme/tokens';

type Props = {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

export default function QuickAccessCard({
  icon,
  label,
  iconBg,
  iconColor,
  onPress,
}: Props) {
  const { colors, fontScale } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
        pressed && { backgroundColor: colors.surfaceMuted, opacity: 0.95 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.label,
          { color: colors.text, fontSize: baseFont.bodySm * fontScale },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: { fontSize: 24 },
  label: { fontWeight: '600', textAlign: 'center' },
});
