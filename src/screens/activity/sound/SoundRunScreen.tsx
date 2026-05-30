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
import { SoundEntry, saveAttempt } from '../../../storage/attempts';
import { useTranslation } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTeam } from '../../../context/TeamContext';
import { baseFont, Colors } from '../../../theme/tokens';

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
  const { colors, fontScale } = useTheme();
  const { team } = useTeam();
  const styles = makeStyles(colors, fontScale);
  const [isFinishing, setIsFinishing] = useState(false);

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

    setIsFinishing(true);

    try {
      const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // entries state holds newest-first; persist in chronological order so
      // the result screen reads oldest-first.
      const ordered = [...entries].reverse();

      await saveAttempt<SoundEntry>({
        id: baseId,
        activityId,
        finishedAt: Date.now(),
        entries: ordered,
      });

      navigation.replace('ActivityResult', { activityId });
    } catch (err) {
      console.error('Error finishing activity:', err);
      Alert.alert('Error', 'Failed to save activity result');
    } finally {
      setIsFinishing(false);
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
          placeholderTextColor={colors.textSubtle}
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
            color={recorderState.isRecording ? colors.danger : undefined}
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
          disabled={recorderState.isRecording || isFinishing}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors, fontScale: number) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.background },
    heading: { fontSize: baseFont.subheading * fontScale, fontWeight: '700', color: colors.text },
    subheading: { fontSize: baseFont.bodySm * fontScale, color: colors.textMuted, marginBottom: 16 },
    form: {
      backgroundColor: colors.surfaceSubtle,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    label: { fontSize: baseFont.small * fontScale, fontWeight: '600', marginBottom: 4, marginTop: 4, color: colors.text },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.inputBg,
      color: colors.text,
      marginBottom: 8,
    },
    meterBox: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      marginBottom: 8,
    },
    meterValue: { fontSize: 28 * fontScale, fontWeight: '700', color: colors.primary },
    meterHint: { fontSize: baseFont.tiny * fontScale, color: colors.textMuted, marginTop: 4 },
    recordButton: { marginTop: 4, marginBottom: 6 },
    addButton: { marginTop: 4 },
    listHeading: { fontSize: baseFont.bodySm * fontScale, fontWeight: '600', marginBottom: 6, color: colors.text },
    list: { flex: 1 },
    emptyText: { color: colors.textSubtle, fontStyle: 'italic', paddingVertical: 8 },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryAction: { fontSize: 15 * fontScale, color: colors.text },
    entryDb: { fontSize: 15 * fontScale, fontWeight: '600', color: colors.primary },
    finishButton: { marginTop: 12 },
  });
