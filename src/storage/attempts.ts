import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'attempts:';

export type SoundEntry = {
  id: string;
  action: string;
  decibels: number;
};

export type ActivityAttempt = {
  id: string;
  activityId: string;
  finishedAt: number;
  entries: SoundEntry[];
};

export async function saveAttempt(attempt: ActivityAttempt): Promise<void> {
  const existing = await loadAttempts(attempt.activityId);
  const updated = [attempt, ...existing];
  await AsyncStorage.setItem(KEY_PREFIX + attempt.activityId, JSON.stringify(updated));
}

export async function loadAttempts(activityId: string): Promise<ActivityAttempt[]> {
  const raw = await AsyncStorage.getItem(KEY_PREFIX + activityId);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityAttempt[];
  } catch {
    return [];
  }
}
