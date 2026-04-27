import { useEffect, useState } from 'react';
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
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { saveAttempt, SoundEntry } from '../../storage/attempts';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityRun'>;

// Approximate SPL dB from dBFS metering. Not a real calibrated reading —
// good enough for the activity (quiet room ~30, loud talk ~70, shout ~95).
function meteringToApproxDb(metering: number | null | undefined): number | null {
  if (metering == null || !Number.isFinite(metering)) return null;
  const value = Math.round(metering + 100);
  if (value < 0) return 0;
  if (value > 120) return 120;
  return value;
}

export default function ActivityRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 200);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [action, setAction] = useState('');
  const [capturedDb, setCapturedDb] = useState<number | null>(null);
  const [entries, setEntries] = useState<SoundEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (!status.granted) {
        Alert.alert(
          'Microphone permission denied',
          'You need to allow microphone access to measure sound levels.'
        );
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const liveDb = meteringToApproxDb(recorderState.metering);

  const startRecording = async () => {
    if (permissionGranted === false) {
      Alert.alert('No permission', 'Microphone permission is required.');
      return;
    }
    try {
      setCapturedDb(null);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      Alert.alert('Could not start recording', 'Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      const finalDb = liveDb;
      await audioRecorder.stop();
      if (finalDb != null) setCapturedDb(finalDb);
    } catch (err) {
      Alert.alert('Could not stop recording', 'Please try again.');
    }
  };

  const handleAddEntry = () => {
    const trimmedAction = action.trim();
    if (!trimmedAction) {
      Alert.alert('Missing action', 'Please enter what you were measuring.');
      return;
    }
    if (capturedDb == null) {
      Alert.alert('No measurement', 'Record a sound level before adding the entry.');
      return;
    }

    const newEntry: SoundEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: trimmedAction,
      decibels: capturedDb,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setAction('');
    setCapturedDb(null);
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

  const meterDisplay = recorderState.isRecording
    ? `${liveDb ?? '--'} dB`
    : capturedDb != null
    ? `${capturedDb} dB`
    : '-- dB';

  const meterHint = recorderState.isRecording
    ? 'Listening… tap Stop when done.'
    : capturedDb != null
    ? 'Captured. Add the entry or measure again.'
    : permissionGranted === false
    ? 'Microphone permission denied.'
    : 'Tap Record to start measuring.';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sound Pollution Hunter</Text>
      <Text style={styles.subheading}>
        Type what you are measuring, then record a few seconds of sound.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Action</Text>
        <TextInput
          value={action}
          onChangeText={setAction}
          placeholder="e.g. Lunch bell"
          style={styles.input}
        />

        <Text style={styles.label}>Sound level</Text>
        <View style={styles.meterBox}>
          <Text style={styles.meterValue}>{meterDisplay}</Text>
          <Text style={styles.meterHint}>{meterHint}</Text>
        </View>

        <View style={styles.recordButton}>
          <Button
            title={recorderState.isRecording ? 'Stop' : 'Record'}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            disabled={permissionGranted === false}
            color={recorderState.isRecording ? '#dc2626' : undefined}
          />
        </View>

        <View style={styles.addButton}>
          <Button
            title="Add Entry"
            onPress={handleAddEntry}
            disabled={recorderState.isRecording || capturedDb == null}
          />
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
          disabled={saving || recorderState.isRecording}
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
  meterBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  meterValue: { fontSize: 28, fontWeight: '700', color: '#2563eb' },
  meterHint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  recordButton: { marginTop: 4, marginBottom: 6 },
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
