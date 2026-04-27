import { activities } from '../data/activities';

type ActivityMeta = {
  unit: string;
  lowerIsBetter: boolean;
  precision: number;
};

const META: Record<string, ActivityMeta> = {
  reaction: { unit: 'ms', lowerIsBetter: true, precision: 0 },
  sound: { unit: 'dB', lowerIsBetter: false, precision: 1 },
  earthquake: { unit: 'g', lowerIsBetter: true, precision: 2 },
};

export const RANKED_ACTIVITY_IDS = Object.keys(META);

export function getActivityLabel(activityId: string): string {
  const found = activities.find((a) => a.id === activityId);
  return found?.title ?? activityId;
}

export function getActivityUnit(activityId: string): string {
  return META[activityId]?.unit ?? '';
}

export function isLowerBetter(activityId: string): boolean {
  return META[activityId]?.lowerIsBetter ?? false;
}

export function isRankedActivity(activityId: string): boolean {
  return activityId in META;
}

export function formatResult(activityId: string, value: number | string): string {
  if (typeof value === 'string') return value;
  const meta = META[activityId];
  const precision = meta?.precision ?? 2;
  const unit = meta?.unit ?? '';
  const num = Number(value).toFixed(precision);
  return unit ? `${num} ${unit}` : num;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
