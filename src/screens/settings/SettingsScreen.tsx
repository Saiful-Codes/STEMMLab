import { ReactNode, useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { clearResults, getResults } from '../../storage/results';
import { Colors, baseFont } from '../../theme/tokens';
import { LANGUAGES, LanguageCode } from '../../i18n/translations';
import {
  AuthUser,
  getFriendlyAuthError,
  listenToAuthChanges,
  signOutUser,
} from '../../services/authService';
import {
  getActivityResultsFromFirestore,
  getTeamFromFirestore,
  saveActivityResultToFirestore,
  saveTeamToFirestore,
} from '../../services/firestoreService';
import {
  BatteryStatus,
  getBatteryStatus,
} from '../../services/batteryService';
import {
  BackgroundRunInfo,
  BackgroundTaskStatus,
  getBackgroundTaskStatus,
  getLastBackgroundRun,
  registerBackgroundTask,
  unregisterBackgroundTask,
} from '../../services/backgroundTaskService';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export default function SettingsScreen() {
  const { mode, colors, largeText, fontScale, toggleMode, toggleLargeText } =
    useTheme();
  const { team, clearTeam } = useTeam();
  const { language, setLanguage, t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [working, setWorking] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [battery, setBattery] = useState<BatteryStatus | null>(null);
  const [batteryLoading, setBatteryLoading] = useState(false);
  const [batteryError, setBatteryError] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<BackgroundTaskStatus | null>(null);
  const [bgRun, setBgRun] = useState<BackgroundRunInfo | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const refreshBackgroundStatus = useCallback(async () => {
    try {
      setBgLoading(true);
      setBgError(null);
      const [status, run] = await Promise.all([
        getBackgroundTaskStatus(),
        getLastBackgroundRun(),
      ]);
      setBgStatus(status);
      setBgRun(run);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not read background task status.';
      setBgError(message);
    } finally {
      setBgLoading(false);
    }
  }, []);

  const handleRegisterBackground = async () => {
    try {
      setBgLoading(true);
      setBgError(null);
      await registerBackgroundTask();
      await refreshBackgroundStatus();
    } catch (err) {
      const friendly =
        'Background tasks are not available in this app build. Use a development build to enable this feature.';
      setBgError(friendly);
      Alert.alert('Register failed', friendly);
    } finally {
      setBgLoading(false);
    }
  };

  const handleUnregisterBackground = async () => {
    try {
      setBgLoading(true);
      setBgError(null);
      await unregisterBackgroundTask();
      await refreshBackgroundStatus();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not unregister background task.';
      setBgError(message);
      Alert.alert('Unregister failed', message);
    } finally {
      setBgLoading(false);
    }
  };

  const refreshBattery = useCallback(async () => {
    try {
      setBatteryLoading(true);
      setBatteryError(null);
      const status = await getBatteryStatus();
      setBattery(status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not read battery status.';
      setBatteryError(message);
    } finally {
      setBatteryLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = listenToAuthChanges(setAuthUser);
    return unsub;
  }, []);

  useEffect(() => {
    void refreshBattery();
  }, [refreshBattery]);

  useEffect(() => {
    void refreshBackgroundStatus();
  }, [refreshBackgroundStatus]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      // Local team stays intact — sign-out only clears the cloud session.
      // Auto-mirror simply stops firing until the user signs back in.
      await signOutUser();
      Alert.alert('Signed out', 'Signed out — saves are local only.');
    } catch (err) {
      Alert.alert('Sign out failed', getFriendlyAuthError(err));
    } finally {
      setSigningOut(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!authUser) return;
    try {
      setSyncing(true);
      let teamSynced = 0;
      if (team) {
        await saveTeamToFirestore(team);
        teamSynced = 1;
      }
      const localResults = await getResults();
      for (const r of localResults) {
        await saveActivityResultToFirestore(r);
      }
      Alert.alert(
        'Backed up to cloud',
        `Synced ${teamSynced ? 'team + ' : ''}${localResults.length} result${
          localResults.length === 1 ? '' : 's'
        } to Firestore.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed.';
      Alert.alert('Sync failed', message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!authUser) return;
    try {
      setLoadingCloud(true);
      const cloudTeam = await getTeamFromFirestore(authUser.uid);
      const cloudResults = await getActivityResultsFromFirestore(authUser.uid);
      Alert.alert(
        'Loaded from cloud',
        `Team: ${cloudTeam ? cloudTeam.name : '(none)'}\nResults: ${
          cloudResults.length
        }`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Load failed.';
      Alert.alert('Load failed', message);
    } finally {
      setLoadingCloud(false);
    }
  };

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

      <Section title="Device Status" colors={colors} fontScale={fontScale}>
        {batteryError ? (
          <Text
            style={[
              styles.helper,
              {
                color: colors.dangerText,
                fontSize: baseFont.small * fontScale,
              },
            ]}
          >
            {batteryError}
          </Text>
        ) : !battery ? (
          <Text
            style={[
              styles.helper,
              {
                color: colors.textMuted,
                fontSize: baseFont.small * fontScale,
              },
            ]}
          >
            {batteryLoading ? 'Reading battery…' : 'Battery status unavailable.'}
          </Text>
        ) : (
          <>
            <Row
              label="Battery"
              colors={colors}
              fontScale={fontScale}
              control={
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color: colors.text,
                      fontSize: baseFont.body * fontScale,
                    },
                  ]}
                >
                  {battery.levelPercent !== null
                    ? `${battery.levelPercent}%`
                    : 'Unknown'}
                </Text>
              }
            />
            <Divider color={colors.border} />
            <Row
              label="Charging"
              colors={colors}
              fontScale={fontScale}
              control={
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color: colors.text,
                      fontSize: baseFont.body * fontScale,
                    },
                  ]}
                >
                  {battery.stateLabel}
                </Text>
              }
            />
            <Divider color={colors.border} />
            <Row
              label="Low power mode"
              colors={colors}
              fontScale={fontScale}
              control={
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color: colors.text,
                      fontSize: baseFont.body * fontScale,
                    },
                  ]}
                >
                  {battery.lowPowerMode === null
                    ? 'Unknown'
                    : battery.lowPowerMode
                    ? 'On'
                    : 'Off'}
                </Text>
              }
            />
          </>
        )}
        <Pressable
          onPress={refreshBattery}
          disabled={batteryLoading}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              backgroundColor: pressed
                ? colors.surfaceMuted
                : colors.surfaceSubtle,
              borderColor: colors.border,
            },
            batteryLoading && styles.dangerBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {batteryLoading ? 'Refreshing…' : 'Refresh'}
          </Text>
        </Pressable>
      </Section>

      <Section
        title="Background Task Status"
        colors={colors}
        fontScale={fontScale}
      >
        {bgError ? (
          <Text
            style={[
              styles.helper,
              {
                color: colors.dangerText,
                fontSize: baseFont.small * fontScale,
              },
            ]}
          >
            {bgError}
          </Text>
        ) : null}
        {bgStatus?.available === false ? (
          <Text
            style={[
              styles.helper,
              {
                color: colors.textMuted,
                fontSize: baseFont.small * fontScale,
              },
            ]}
          >
            Background tasks require a development build. They are not available
            in Expo Go.
          </Text>
        ) : null}
        <Row
          label="Registered"
          colors={colors}
          fontScale={fontScale}
          control={
            <Text
              style={[
                styles.statusValue,
                { color: colors.text, fontSize: baseFont.body * fontScale },
              ]}
            >
              {bgStatus ? (bgStatus.registered ? 'Yes' : 'No') : '—'}
            </Text>
          }
        />
        <Divider color={colors.border} />
        <Row
          label="OS status"
          colors={colors}
          fontScale={fontScale}
          control={
            <Text
              style={[
                styles.statusValue,
                { color: colors.text, fontSize: baseFont.body * fontScale },
              ]}
            >
              {bgStatus ? bgStatus.statusLabel : '—'}
            </Text>
          }
        />
        <Divider color={colors.border} />
        <Row
          label="Last run"
          colors={colors}
          fontScale={fontScale}
          control={
            <Text
              style={[
                styles.statusValue,
                { color: colors.text, fontSize: baseFont.body * fontScale },
              ]}
            >
              {bgRun && bgRun.lastRunAt
                ? new Date(bgRun.lastRunAt).toLocaleString()
                : 'Never'}
            </Text>
          }
        />
        <Divider color={colors.border} />
        <Row
          label="Run count"
          colors={colors}
          fontScale={fontScale}
          control={
            <Text
              style={[
                styles.statusValue,
                { color: colors.text, fontSize: baseFont.body * fontScale },
              ]}
            >
              {bgRun ? String(bgRun.runCount) : '0'}
            </Text>
          }
        />
        <Pressable
          onPress={handleRegisterBackground}
          disabled={
            bgLoading ||
            bgStatus?.registered === true ||
            bgStatus?.available === false
          }
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: pressed
                ? colors.primaryPressed
                : colors.primary,
            },
            (bgLoading ||
              bgStatus?.registered === true ||
              bgStatus?.available === false) &&
              styles.dangerBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.primaryBtnText,
              {
                color: colors.primaryText,
                fontSize: baseFont.bodySm * fontScale,
              },
            ]}
          >
            {bgLoading ? 'Working…' : 'Register Task'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleUnregisterBackground}
          disabled={bgLoading || bgStatus?.registered === false}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              backgroundColor: pressed
                ? colors.surfaceMuted
                : colors.surfaceSubtle,
              borderColor: colors.border,
            },
            (bgLoading || bgStatus?.registered === false) &&
              styles.dangerBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            Unregister Task
          </Text>
        </Pressable>
        <Pressable
          onPress={refreshBackgroundStatus}
          disabled={bgLoading}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              backgroundColor: pressed
                ? colors.surfaceMuted
                : colors.surfaceSubtle,
              borderColor: colors.border,
            },
            bgLoading && styles.dangerBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {bgLoading ? 'Refreshing…' : 'Refresh Status'}
          </Text>
        </Pressable>
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

      <Section title="Account" colors={colors} fontScale={fontScale}>
        <Text
          style={[
            styles.syncStatus,
            {
              color: authUser ? colors.primary : colors.textMuted,
              fontSize: baseFont.bodySm * fontScale,
            },
          ]}
        >
          {authUser ? 'Cloud sync: ON ✓' : 'Cloud sync: OFF'}
        </Text>
        <Text
          style={[
            styles.helper,
            { color: colors.textMuted, fontSize: baseFont.small * fontScale },
          ]}
        >
          {authUser
            ? `Signed in as ${authUser.email ?? 'unknown user'}`
            : 'Not signed in. Sign in to use cloud features.'}
        </Text>
        {authUser ? (
          <>
            <Pressable
              onPress={handleSyncToCloud}
              disabled={syncing || loadingCloud}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: pressed
                    ? colors.primaryPressed
                    : colors.primary,
                },
                (syncing || loadingCloud) && styles.dangerBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  {
                    color: colors.primaryText,
                    fontSize: baseFont.bodySm * fontScale,
                  },
                ]}
              >
                {syncing ? 'Backing up…' : 'Back up to cloud'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleLoadFromCloud}
              disabled={syncing || loadingCloud}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: pressed
                    ? colors.surfaceMuted
                    : colors.surfaceSubtle,
                  borderColor: colors.border,
                },
                (syncing || loadingCloud) && styles.dangerBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: colors.text, fontSize: baseFont.bodySm * fontScale },
                ]}
              >
                {loadingCloud ? 'Loading…' : 'Load from cloud (verify)'}
              </Text>
            </Pressable>
            <DangerButton
              label={signingOut ? 'Signing out…' : 'Sign out'}
              colors={colors}
              fontScale={fontScale}
              disabled={signingOut}
              onPress={handleSignOut}
            />
          </>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('Auth')}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed
                  ? colors.primaryPressed
                  : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.primaryBtnText,
                {
                  color: colors.primaryText,
                  fontSize: baseFont.bodySm * fontScale,
                },
              ]}
            >
              Sign in or create account
            </Text>
          </Pressable>
        )}
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
  syncStatus: { fontWeight: '700', marginBottom: 4 },
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
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: '600' },
  statusValue: { fontWeight: '600' },
});
