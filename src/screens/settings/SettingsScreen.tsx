import { ReactNode, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { clearResults } from '../../storage/results';
import { Colors, baseFont } from '../../theme/tokens';

export default function SettingsScreen() {
  const { mode, colors, largeText, fontScale, toggleMode, toggleLargeText } =
    useTheme();
  const { team, clearTeam } = useTeam();
  const [working, setWorking] = useState(false);

  const handleResetTeam = () => {
    Alert.alert(
      'Reset team?',
      'This signs out the current team. Saved results will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setWorking(true);
              await clearTeam();
            } catch {
              Alert.alert('Error', 'Could not reset team. Please try again.');
            } finally {
              setWorking(false);
            }
          },
        },
      ]
    );
  };

  const handleClearResults = () => {
    Alert.alert(
      'Clear all results?',
      'This permanently deletes every saved attempt across activities. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setWorking(true);
              await clearResults();
              Alert.alert('Done', 'All saved results have been cleared.');
            } catch {
              Alert.alert('Error', 'Could not clear results. Please try again.');
            } finally {
              setWorking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text
        style={[
          styles.heading,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        Settings
      </Text>
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        Theme, accessibility, and reset options.
      </Text>

      <Section title="Display" colors={colors} fontScale={fontScale}>
        <Row
          label="Dark mode"
          colors={colors}
          fontScale={fontScale}
          control={
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
            />
          }
        />
        <Divider color={colors.border} />
        <Row
          label="Large text"
          hint="Increases font sizes across the app for better readability."
          colors={colors}
          fontScale={fontScale}
          control={
            <Switch
              value={largeText}
              onValueChange={toggleLargeText}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
            />
          }
        />
      </Section>

      <Section title="Team" colors={colors} fontScale={fontScale}>
        <Text
          style={[
            styles.helper,
            { color: colors.textMuted, fontSize: baseFont.small * fontScale },
          ]}
        >
          {team
            ? `Current team: ${team.name} (${team.members.length} member${
                team.members.length === 1 ? '' : 's'
              })`
            : 'No team set up.'}
        </Text>
        <DangerButton
          label="Reset team"
          colors={colors}
          fontScale={fontScale}
          disabled={working || !team}
          onPress={handleResetTeam}
        />
      </Section>

      <Section title="Data" colors={colors} fontScale={fontScale}>
        <DangerButton
          label="Clear all results"
          colors={colors}
          fontScale={fontScale}
          disabled={working}
          onPress={handleClearResults}
        />
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  colors,
  fontScale,
  children,
}: {
  title: string;
  colors: Colors;
  fontScale: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  hint,
  control,
  colors,
  fontScale,
}: {
  label: string;
  hint?: string;
  control: ReactNode;
  colors: Colors;
  fontScale: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            { color: colors.text, fontSize: baseFont.body * fontScale },
          ]}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              styles.rowHint,
              { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {control}
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function DangerButton({
  label,
  onPress,
  disabled,
  colors,
  fontScale,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: Colors;
  fontScale: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.dangerBtn,
        {
          backgroundColor: pressed ? colors.dangerSoftPressed : colors.dangerSoft,
        },
        disabled && styles.dangerBtnDisabled,
      ]}
    >
      <Text
        style={[
          styles.dangerBtnText,
          { color: colors.dangerText, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: '700' },
  subheading: { marginTop: 4, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBody: { borderRadius: 12, borderWidth: 1, padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowLabel: { fontWeight: '600' },
  rowHint: { marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  helper: { marginBottom: 12 },
  dangerBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerBtnDisabled: { opacity: 0.5 },
  dangerBtnText: { fontWeight: '700' },
});
