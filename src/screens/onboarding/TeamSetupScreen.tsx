import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import MemberInputList from '../../components/MemberInputList';
import { baseFont } from '../../theme/tokens';

export default function TeamSetupScreen() {
  const { saveTeam } = useTeam();
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const trimmedName = teamName.trim();
    const trimmedGrade = grade.trim();
    const cleanMembers = members.map((m) => m.trim()).filter((m) => m.length > 0);

    if (!trimmedName) {
      Alert.alert(
        t('teamSetup.alert.missingTitle'),
        t('teamSetup.alert.missingName')
      );
      return;
    }
    if (cleanMembers.length === 0) {
      Alert.alert(
        t('teamSetup.alert.missingTitle'),
        t('teamSetup.alert.missingMembers')
      );
      return;
    }
    if (!trimmedGrade) {
      Alert.alert(
        t('teamSetup.alert.missingTitle'),
        t('teamSetup.alert.missingGrade')
      );
      return;
    }

    setSubmitting(true);
    try {
      await saveTeam({
        name: trimmedName,
        members: cleanMembers,
        grade: trimmedGrade,
        createdAt: Date.now(),
      });
    } catch {
      Alert.alert(
        t('teamSetup.alert.errorTitle'),
        t('teamSetup.alert.errorMessage')
      );
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderColor: colors.borderStrong,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: baseFont.body * fontScale,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: baseFont.heading * fontScale },
          ]}
        >
          {t('teamSetup.title')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
          ]}
        >
          {t('teamSetup.subtitle')}
        </Text>

        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {t('teamSetup.teamName')}
          </Text>
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder={t('teamSetup.teamNamePlaceholder')}
            placeholderTextColor={colors.textSubtle}
            value={teamName}
            onChangeText={setTeamName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {t('teamSetup.members')}
          </Text>
          <MemberInputList members={members} onChange={setMembers} />
        </View>

        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontSize: baseFont.bodySm * fontScale },
            ]}
          >
            {t('teamSetup.grade')}
          </Text>
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder={t('teamSetup.gradePlaceholder')}
            placeholderTextColor={colors.textSubtle}
            value={grade}
            onChangeText={setGrade}
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
            submitting && styles.submitBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitBtnText,
              { color: colors.primaryText, fontSize: baseFont.body * fontScale },
            ]}
          >
            {submitting ? t('teamSetup.saving') : t('teamSetup.save')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontWeight: '600', marginBottom: 4 },
  subtitle: { marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '600' },
});
