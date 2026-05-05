import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { baseFont } from '../../theme/tokens';
import {
  getFriendlyAuthError,
  signInWithEmail,
  signUpWithEmail,
} from '../../services/authService';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Mode = 'signin' | 'signup';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const { colors, fontScale } = useTheme();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignIn = mode === 'signin';

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter an email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    try {
      setSubmitting(true);
      if (isSignIn) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigation.goBack();
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[
              styles.heading,
              { color: colors.text, fontSize: baseFont.heading * fontScale },
            ]}
          >
            {isSignIn ? 'Sign in' : 'Create account'}
          </Text>
          <Text
            style={[
              styles.subheading,
              { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {isSignIn
              ? 'Sign in with email and password.'
              : 'Create a new account with email and password.'}
          </Text>

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <ToggleTab
              label="Sign in"
              active={isSignIn}
              onPress={() => {
                setMode('signin');
                setError(null);
              }}
              activeBg={colors.primary}
              activeText={colors.primaryText}
              inactiveText={colors.text}
              fontScale={fontScale}
            />
            <ToggleTab
              label="Sign up"
              active={!isSignIn}
              onPress={() => {
                setMode('signup');
                setError(null);
              }}
              activeBg={colors.primary}
              activeText={colors.primaryText}
              inactiveText={colors.text}
              fontScale={fontScale}
            />
          </View>

          <Field label="Email" colors={colors} fontScale={fontScale}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.textSubtle}
              editable={!submitting}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  fontSize: baseFont.body * fontScale,
                },
              ]}
            />
          </Field>

          <Field label="Password" colors={colors} fontScale={fontScale}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSubtle}
              editable={!submitting}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  fontSize: baseFont.body * fontScale,
                },
              ]}
            />
          </Field>

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.dangerSoftPressed,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.dangerText,
                  fontSize: baseFont.bodySm * fontScale,
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
              },
              submitting && styles.submitBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text
                style={[
                  styles.submitBtnText,
                  {
                    color: colors.primaryText,
                    fontSize: baseFont.body * fontScale,
                  },
                ]}
              >
                {isSignIn ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ToggleTab({
  label,
  active,
  onPress,
  activeBg,
  activeText,
  inactiveText,
  fontScale,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeBg: string;
  activeText: string;
  inactiveText: string;
  fontScale: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.toggleTab,
        active && { backgroundColor: activeBg },
        pressed && !active && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.toggleTabText,
          {
            color: active ? activeText : inactiveText,
            fontSize: baseFont.bodySm * fontScale,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  colors,
  fontScale,
  children,
}: {
  label: string;
  colors: { textMuted: string };
  fontScale: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: '700' },
  subheading: { marginTop: 4, marginBottom: 16 },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleTabText: { fontWeight: '600' },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '700' },
});
