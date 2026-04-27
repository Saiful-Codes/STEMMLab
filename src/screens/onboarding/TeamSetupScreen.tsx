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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTeam } from '../../context/TeamContext';
import MemberInputList from '../../components/MemberInputList';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSetup'>;

export default function TeamSetupScreen({ navigation }: Props) {
  const { saveTeam } = useTeam();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const trimmedName = teamName.trim();
    const trimmedGrade = grade.trim();
    const cleanMembers = members.map((m) => m.trim()).filter((m) => m.length > 0);

    if (!trimmedName) {
      Alert.alert('Missing info', 'Please enter a team name.');
      return;
    }
    if (cleanMembers.length === 0) {
      Alert.alert('Missing info', 'Please add at least one member.');
      return;
    }
    if (!trimmedGrade) {
      Alert.alert('Missing info', 'Please enter a grade or year level.');
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
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Error', 'Could not save team. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Team Setup</Text>
        <Text style={styles.subtitle}>
          Tell us about your team before you start exploring activities.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Lab Rats"
            value={teamName}
            onChangeText={setTeamName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Members</Text>
          <MemberInputList members={members} onChange={setMembers} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Grade / Year Level</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Grade 9"
            value={grade}
            onChangeText={setGrade}
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && styles.submitBtnPressed,
            submitting && styles.submitBtnDisabled,
          ]}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Saving...' : 'Save & Continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnPressed: { backgroundColor: '#1d4ed8' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
