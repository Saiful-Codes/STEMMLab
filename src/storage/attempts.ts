import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'attempts:';

export type SoundEntry = {
  id: string;
  action: string;
  decibels: number;
};

export type ReactionEntry = {
  id: string;
  attemptNumber: number;
  reactionMs: number;
};

export type EarthquakeEntry = {
  id: string;
  attemptNumber: number;
  durationMs: number;
  peakMagnitude: number;
  avgMagnitude: number;
  samples: number;
};

export type AttemptEntry = SoundEntry | ReactionEntry | EarthquakeEntry;

export type ActivityAttempt<E extends AttemptEntry = AttemptEntry> = {
  id: string;
  activityId: string;
  finishedAt: number;
  entries: E[];
};

export async function saveAttempt<E extends AttemptEntry>(
  attempt: ActivityAttempt<E>
): Promise<void> {
  const existing = await loadAttempts<E>(attempt.activityId);
  const updated = [attempt, ...existing];
  await AsyncStorage.setItem(KEY_PREFIX + attempt.activityId, JSON.stringify(updated));
}

export async function loadAttempts<E extends AttemptEntry = AttemptEntry>(
  activityId: string
): Promise<ActivityAttempt<E>[]> {
  const raw = await AsyncStorage.getItem(KEY_PREFIX + activityId);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityAttempt<E>[];
  } catch {
    return [];
  }
}
