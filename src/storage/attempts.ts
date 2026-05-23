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

export type StudentLevel = 'primary' | 'highschool';

export type ParachuteTrialInput = {
  fallTime: number;
  contactTime?: number;
  didBounce?: boolean;
  bounceTime?: number;
};

export type ParachuteTrialResult = {
  finalVelocity: number;
  acceleration: number;
  netForce: number;
  weight: number;
  dragForce: number;
  gForce: number;
  gForceRisk: string;
};

export type ParachuteEntry = {
  id: string;
  trialNumber: 1 | 2 | 3;
  trialLabel: string;
  input: ParachuteTrialInput;
  result: ParachuteTrialResult;
};

export type ParachuteMeta = {
  studentLevel: StudentLevel;
  dropHeight: number;
  toyMass: number;
};

export type HandFanTrialInput = {
  designName: string;
  predictedAngle: number;
  actualAngle: number;
  notes: string;
};

export type HandFanTrialResult = {
  bendAngleRad: number;
  estimatedForce: number;
};

export type HandFanEntry = {
  id: string;
  trialNumber: 1 | 2 | 3;
  trialLabel: string;
  input: HandFanTrialInput;
  result: HandFanTrialResult;
};

export type HandFanMeta = {
  materialType: string;
  distance: number;
};

export type PerformanceBucket = 'low' | 'medium' | 'high';

export type PerformanceEntry = {
  id: string;
  movementNumber: 1 | 2 | 3;
  movementLabel: string;
  prediction: PerformanceBucket;
  actualBucket: PerformanceBucket;
  predictionCorrect: boolean;
  durationMs: number;
  peakMagnitude: number;
  avgMagnitude: number;
  smoothnessScore: number;
  samples: number;
  vibrationFeedbackUsed: boolean;
  notes?: string;
};

export type PerformanceMeta = {
  vibrationFeedbackEnabled: boolean;
};

export type AttemptEntry =
  | SoundEntry
  | ReactionEntry
  | EarthquakeEntry
  | ParachuteEntry
  | HandFanEntry
  | PerformanceEntry;

export type ActivityAttempt<E extends AttemptEntry = AttemptEntry> = {
  id: string;
  activityId: string;
  finishedAt: number;
  entries: E[];
  meta?: unknown;
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
