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
import { ActivityStackParamList } from '../../../navigation/ActivityStack';
import { SoundEntry } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useLocation } from '../../../context/LocationContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useTeam } from '../../../context/TeamContext';
import { saveActivityResultWithLocation } from '../../../utils/activityResultHelper';
import type { Result } from '../../../types/Result';

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

export default function SoundRunScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { t } = useTranslation();
  const { team } = useTeam();
  const { location, refreshLocation } = useLocation();
  const { sendAchievement } = useNotifications();

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 200);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [action, setAction] = useState('');
  const [capturedDb, setCapturedDb] = useState<number | null>(null);
  const [entries, setEntries] = useState<SoundEntry[]>([]);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (!status.granted) {
        Alert.alert(
          t('run.sound.alert.permissionTitle'),
          t('run.sound.alert.permissionMessage')
        );
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
    // Get location on mount
    refreshLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveDb = meteringToApproxDb(recorderState.metering);

  const startRecording = async () => {
    if (permissionGranted === false) {
      Alert.alert(
        t('run.sound.alert.noPermissionTitle'),
        t('run.sound.alert.noPermissionMessage')
      );
      return;
    }
    try {
      setCapturedDb(null);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      Alert.alert(
        t('run.sound.alert.startFailTitle'),
        t('run.sound.alert.startFailMessage')
      );
    }
  };

  const stopRecording = async () => {
    try {
      const finalDb = liveDb;
      await audioRecorder.stop();
      if (finalDb != null) setCapturedDb(finalDb);
    } catch (err) {
      Alert.alert(
        t('run.sound.alert.stopFailTitle'),
        t('run.sound.alert.stopFailMessage')
      );
    }
  };

  const handleAddEntry = () => {
    const trimmedAction = action.trim();
    if (!trimmedAction) {
      Alert.alert(
        t('run.sound.alert.missingActionTitle'),
        t('run.sound.alert.missingActionMessage')
      );
      return;
    }
    if (capturedDb == null) {
      Alert.alert(
        t('run.sound.alert.noMeasurementTitle'),
        t('run.sound.alert.noMeasurementMessage')
      );
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
      Alert.alert(
        t('run.sound.alert.noEntriesTitle'),
        t('run.sound.alert.noEntriesMessage')
      );
      return;
    }

    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    try {
      // Refresh location before finishing
      await refreshLocation();
      Alert.alert(
  'GPS Test',
  `Lat: ${location?.latitude}\nLng: ${location?.longitude}\nLocation: ${location?.locationName || 'Unknown'}`
);

      const peakDb = Math.max(...entries.map((e) => e.decibels));

      // Save result with GPS location
      const result: Result = {
        id: `result_${Date.now()}`,
        activityId,
        teamName: team.name,
        members: team.members,
        result: peakDb,
        timestamp: Date.now(),
      };

      await saveActivityResultWithLocation(result, location);

      // Send completion notification
      await sendAchievement(
  'Sound Pollution Hunter Complete! 🔊',
  `${team.name} measured sound levels${location?.locationName ? ` at ${location.locationName}` : ''}`
);

Alert.alert(
  'Activity Saved!',
  `GPS location captured:\n${location?.locationName || 'Unknown location'}`
);

navigation.replace('ResultSummary', {
        activityId,
        result: peakDb,
      });
    } catch (err) {
      console.error('Error finishing activity:', err);
      Alert.alert('Error', 'Failed to save activity result');
    }
  };

  const meterDisplay = recorderState.isRecording
    ? `${liveDb ?? '--'} dB`
    : capturedDb != null
    ? `${capturedDb} dB`
    : '-- dB';

  const meterHint = recorderState.isRecording
    ? t('run.sound.hint.listening')
    : capturedDb != null
    ? t('run.sound.hint.captured')
    : permissionGranted === false
    ? t('run.sound.hint.denied')
    : t('run.sound.hint.tapRecord');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('run.sound.heading')}</Text>
      <Text style={styles.subheading}>{t('run.sound.subheading')}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>{t('run.sound.action')}</Text>
        <TextInput
          value={action}
          onChangeText={setAction}
          placeholder={t('run.sound.actionPlaceholder')}
          style={styles.input}
        />

        <Text style={styles.label}>{t('run.sound.level')}</Text>
        <View style={styles.meterBox}>
          <Text style={styles.meterValue}>{meterDisplay}</Text>
          <Text style={styles.meterHint}>{meterHint}</Text>
        </View>

        <View style={styles.recordButton}>
          <Button
            title={
              recorderState.isRecording ? t('run.sound.stop') : t('run.sound.record')
            }
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            disabled={permissionGranted === false}
            color={recorderState.isRecording ? '#dc2626' : undefined}
          />
        </View>

        <View style={styles.addButton}>
          <Button
            title={t('run.sound.addEntry')}
            onPress={handleAddEntry}
            disabled={recorderState.isRecording || capturedDb == null}
          />
        </View>
      </View>

      <Text style={styles.listHeading}>
        {t('run.sound.entriesHeading', { count: entries.length })}
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('run.sound.empty')}</Text>
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
          title={t('run.sound.finish')}
          onPress={handleFinish}
          disabled={recorderState.isRecording}
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
