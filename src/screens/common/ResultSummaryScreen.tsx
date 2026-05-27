import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { activities } from '../../data/activities';
import { useTeam } from '../../context/TeamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { getCurrentLocation } from '../../services/gpsService';
import { saveResult } from '../../storage/results';
import { getCurrentUser } from '../../services/authService';
import { saveActivityResultToFirestore } from '../../services/firestoreService';
import { sendActivityCompleteNotification } from '../../services/notificationService';
import { Result } from '../../types/Result';
import { baseFont } from '../../theme/tokens';
import { getActivityTitleKey, formatResult } from '../../utils/activityLabels';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ResultSummary'>;

export default function ResultSummaryScreen({ navigation, route }: Props) {
  const { activityId, result } = route.params;
  const { team } = useTeam();
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();
  const { location, requestPermission } = useLocation();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const activity = activities.find((a) => a.id === activityId);
  const activityTitle = activity
    ? t(getActivityTitleKey(activity.id))
    : activityId;

  const handleSave = async () => {
    if (!team) {
      Alert.alert(
        t('summary.alert.noTeamTitle'),
        t('summary.alert.noTeamMessage')
      );
      return;
    }

    setSaving(true);

    // Capture a fresh GPS fix at save time. Falls back to the cached
    // context value, then to no-location if permission was denied.
    let currentLocation = location;
    try {
      await requestPermission();
      const fresh = await getCurrentLocation();
      if (fresh) currentLocation = fresh;
    } catch (err) {
      console.warn('[ResultSummaryScreen] Failed to get location:', err);
    }

    const payload: Result = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activityId,
      teamName: team.name,
      members: team.members,
      result,
      timestamp: Date.now(),
      rating: rating > 0 ? rating : undefined,
      comment: comment.trim() ? comment.trim() : undefined,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      accuracy: currentLocation?.accuracy,
      locationName: currentLocation?.locationName,
    };

    try {
      await saveResult(payload);

      // Auto-mirror to Firestore when signed in. Fire-and-forget: the local
      // save above is the source of truth, so a cloud failure must not block
      // the user or surface an alert.
      if (getCurrentUser()) {
        saveActivityResultToFirestore(payload).catch((err) => {
          console.warn('[ResultSummaryScreen] Cloud result mirror failed:', err);
        });
      }

      // Send notification about activity completion
      const formattedResult = formatResult(activityId, result);
      await sendActivityCompleteNotification(
        activityTitle,
        formattedResult,
        currentLocation?.locationName,
        {
          activityId,
          resultId: payload.id,
          teamName: team.name,
        }
      );

      navigation.popToTop();
    } catch {
      Alert.alert(
        t('summary.alert.saveFailTitle'),
        t('summary.alert.saveFailMessage')
      );
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.heading,
          { color: colors.textMuted, fontSize: baseFont.small * fontScale },
        ]}
      >
        {t('summary.heading')}
      </Text>
      <Text
        style={[
          styles.activity,
          { color: colors.text, fontSize: baseFont.title * fontScale },
        ]}
      >
        {activityTitle}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceMuted }]}>
        <Text
          style={[
            styles.cardLabel,
            { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
          ]}
        >
          {t('summary.resultLabel')}
        </Text>
        <Text
          style={[
            styles.cardValue,
            { color: colors.primary, fontSize: baseFont.display * fontScale },
          ]}
        >
          {String(result)}
        </Text>
        {team && (
          <Text
            style={[
              styles.cardMeta,
              { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
            ]}
          >
            {t('summary.teamMeta', {
              name: team.name,
              count: team.members.length,
              member:
                team.members.length === 1
                  ? t('settings.team.memberSingular')
                  : t('settings.team.memberPlural'),
            })}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.label,
          { color: colors.text, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('summary.rate')}
      </Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n === rating ? 0 : n)}
            style={styles.star}
          >
            <Text
              style={[
                styles.starText,
                {
                  color: n <= rating ? colors.star : colors.starDim,
                  fontSize: 36 * fontScale,
                },
              ]}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>

      <Text
        style={[
          styles.label,
          { color: colors.text, fontSize: baseFont.bodySm * fontScale },
        ]}
      >
        {t('summary.reflection')}
      </Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={t('summary.reflectionPlaceholder')}
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          {
            borderColor: colors.borderStrong,
            backgroundColor: colors.inputBg,
            color: colors.text,
            fontSize: baseFont.body * fontScale,
          },
        ]}
        multiline
        numberOfLines={4}
      />

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveBtn,
          {
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          },
          saving && styles.saveBtnDisabled,
        ]}
      >
        <Text
          style={[
            styles.saveBtnText,
            { color: colors.primaryText, fontSize: baseFont.body * fontScale },
          ]}
        >
          {saving ? t('summary.saving') : t('summary.save')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { textTransform: 'uppercase', letterSpacing: 1 },
  activity: { fontWeight: '700', marginTop: 4, marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 20 },
  cardLabel: {},
  cardValue: { fontWeight: '800', marginTop: 4 },
  cardMeta: { marginTop: 8 },
  label: { fontWeight: '600', marginBottom: 8 },
  starRow: { flexDirection: 'row', marginBottom: 20 },
  star: { paddingHorizontal: 4 },
  starText: {},
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 'auto',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontWeight: '700' },
});
