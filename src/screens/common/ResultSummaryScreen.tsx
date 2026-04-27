import { useState } from 'react';
import {
  Alert,
  Button,
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
import { saveResult } from '../../storage/results';
import { Result } from '../../types/Result';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ResultSummary'>;

export default function ResultSummaryScreen({ navigation, route }: Props) {
  const { activityId, result } = route.params;
  const { team } = useTeam();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const activity = activities.find((a) => a.id === activityId);
  const activityTitle = activity?.title ?? activityId;

  const handleSave = async () => {
    if (!team) {
      Alert.alert('No team', 'Set up a team before saving results.');
      return;
    }

    setSaving(true);
    const payload: Result = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      activityId,
      teamName: team.name,
      members: team.members,
      result,
      timestamp: Date.now(),
      rating: rating > 0 ? rating : undefined,
      comment: comment.trim() ? comment.trim() : undefined,
    };

    try {
      await saveResult(payload);
      navigation.popToTop();
    } catch (err) {
      Alert.alert('Save failed', 'Could not save your result. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Activity complete</Text>
      <Text style={styles.activity}>{activityTitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Result</Text>
        <Text style={styles.cardValue}>{String(result)}</Text>
        {team && (
          <Text style={styles.cardMeta}>
            Team: {team.name} · {team.members.length} member
            {team.members.length === 1 ? '' : 's'}
          </Text>
        )}
      </View>

      <Text style={styles.label}>Rate this experiment</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n === rating ? 0 : n)}
            style={styles.star}
          >
            <Text style={[styles.starText, n <= rating && styles.starTextOn]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Reflection (optional)</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="What did you notice? What would you change?"
        style={styles.input}
        multiline
        numberOfLines={4}
      />

      <View style={styles.saveButton}>
        <Button
          title={saving ? 'Saving…' : 'Save Result'}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
  activity: { fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: { fontSize: 12, color: '#6b7280' },
  cardValue: { fontSize: 32, fontWeight: '800', color: '#2563eb', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  starRow: { flexDirection: 'row', marginBottom: 20 },
  star: { paddingHorizontal: 4 },
  starText: { fontSize: 36, color: '#d1d5db' },
  starTextOn: { color: '#f59e0b' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: { marginTop: 'auto' },
});
