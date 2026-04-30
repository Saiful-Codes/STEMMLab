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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { clearResults } from '../../storage/results';
import { Colors, baseFont } from '../../theme/tokens';
import { LANGUAGES, LanguageCode } from '../../i18n/translations';

export default function SettingsScreen() {
  const { mode, colors, largeText, fontScale, toggleMode, toggleLargeText } =
    useTheme();
  const { team, clearTeam } = useTeam();
  const { language, setLanguage, t } = useTranslation();
  const [working, setWorking] = useState(false);

  const handleResetTeam = () => {
    Alert.alert(
      t('settings.alert.resetTeam.title'),
      t('settings.alert.resetTeam.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              setWorking(true);
              await clearTeam();
            } catch {
              Alert.alert(t('settings.alert.error'), t('settings.alert.resetError'));
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
      t('settings.alert.clearResults.title'),
      t('settings.alert.clearResults.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              setWorking(true);
              await clearResults();
              Alert.alert(
                t('settings.alert.cleared.title'),
                t('settings.alert.cleared.message')
              );
            } catch {
              Alert.alert(t('settings.alert.error'), t('settings.alert.clearError'));
            } finally {
              setWorking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
      <Text
        style={[
          styles.heading,
          { color: colors.text, fontSize: baseFont.heading * fontScale },
        ]}
      >
        {t('settings.heading')}
      </Text>
      <Text
        style={[
          styles.subheading,
          { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('settings.subheading')}
      </Text>

      <Section
        title={t('settings.section.display')}
        colors={colors}
        fontScale={fontScale}
      >
        <Row
          label={t('settings.darkMode')}
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
          label={t('settings.largeText')}
          hint={t('settings.largeTextHint')}
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

      <Section
        title={t('settings.section.language')}
        colors={colors}
        fontScale={fontScale}
      >
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const selected = lang.code === language;
            return (
              <LanguagePill
                key={lang.code}
                code={lang.code}
                label={lang.label}
                selected={selected}
                onPress={() => setLanguage(lang.code)}
                colors={colors}
                fontScale={fontScale}
              />
            );
          })}
        </View>
      </Section>

      <Section
        title={t('settings.section.team')}
        colors={colors}
        fontScale={fontScale}
      >
        <Text
          style={[
            styles.helper,
            { color: colors.textMuted, fontSize: baseFont.small * fontScale },
          ]}
        >
          {team
            ? t('settings.team.current', {
                name: team.name,
                count: team.members.length,
                member:
                  team.members.length === 1
                    ? t('settings.team.memberSingular')
                    : t('settings.team.memberPlural'),
              })
            : t('settings.team.none')}
        </Text>
        <DangerButton
          label={t('settings.resetTeam')}
          colors={colors}
          fontScale={fontScale}
          disabled={working || !team}
          onPress={handleResetTeam}
        />
      </Section>

      <Section
        title={t('settings.section.data')}
        colors={colors}
        fontScale={fontScale}
      >
        <DangerButton
          label={t('settings.clearResults')}
          colors={colors}
          fontScale={fontScale}
          disabled={working}
          onPress={handleClearResults}
        />
      </Section>
      </ScrollView>
    </SafeAreaView>
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

function LanguagePill({
  code,
  label,
  selected,
  onPress,
  colors,
  fontScale,
}: {
  code: LanguageCode;
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: Colors;
  fontScale: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.langPill,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceMuted,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.langPillText,
          {
            color: selected ? colors.primaryText : colors.text,
            fontSize: baseFont.bodySm * fontScale,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
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
  safeArea: { flex: 1 },
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
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  langPillText: { fontWeight: '600' },
  dangerBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerBtnDisabled: { opacity: 0.5 },
  dangerBtnText: { fontWeight: '700' },
});
