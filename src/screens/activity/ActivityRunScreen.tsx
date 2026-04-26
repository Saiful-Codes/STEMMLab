import { useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { saveAttempt, SoundEntry } from '../../storage/attempts';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

export default function ActivityRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;

  const [action, setAction] = useState('');
  const [decibels, setDecibels] = useState('');
  const [entries, setEntries] = useState<SoundEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddEntry = () => {
    const trimmedAction = action.trim();
    const dbValue = Number(decibels);

    if (!trimmedAction) {
      Alert.alert('Missing action', 'Please enter what you were measuring.');
      return;
    }
    if (!Number.isFinite(dbValue) || dbValue < 0) {
      Alert.alert('Invalid dB', 'Please enter a positive number for decibels.');
      return;
    }

    const newEntry: SoundEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: trimmedAction,
      decibels: dbValue,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setAction('');
    setDecibels('');
  };

  const handleFinish = async () => {
    if (entries.length === 0) {
      Alert.alert('No entries', 'Add at least one entry before finishing.');
      return;
    }

    setSaving(true);
    try {
      await saveAttempt({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        activityId,
        finishedAt: Date.now(),
        entries,
      });
      navigation.replace('ActivityResult', { activityId });
    } catch (err) {
      Alert.alert('Save failed', 'Could not save your attempt. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sound Pollution Hunter</Text>
      <Text style={styles.subheading}>
        Record an action and the sound level you measured (in dB).
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Action</Text>
        <TextInput
          value={action}
          onChangeText={setAction}
          placeholder="e.g. Lunch bell"
          style={styles.input}
        />
        <Text style={styles.label}>Sound level (dB)</Text>
        <TextInput
          value={decibels}
          onChangeText={setDecibels}
          placeholder="e.g. 78"
          keyboardType="numeric"
          style={styles.input}
        />
        <View style={styles.addButton}>
          <Button title="Add Entry" onPress={handleAddEntry} />
        </View>
      </View>

      <Text style={styles.listHeading}>
        Entries this session ({entries.length})
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No entries yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <Text style={styles.entryAction}>{item.action}</Text>
            <Text style={styles.entryDb}>{item.decibels} dB</Text>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.finishButton}>
        <Button
          title={saving ? 'Saving…' : 'Finish Activity'}
          onPress={handleFinish}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  form: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  addButton: { marginTop: 4 },
  listHeading: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  list: { flex: 1 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', paddingVertical: 8 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryAction: { fontSize: 15, color: '#111827' },
  entryDb: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  finishButton: { marginTop: 12 },
});
