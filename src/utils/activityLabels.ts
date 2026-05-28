import { activities } from '../data/activities';
import { translate, LanguageCode } from '../i18n/translations';

type ActivityMeta = {
  unit: string;
  lowerIsBetter: boolean;
  precision: number;
};

const META: Record<string, ActivityMeta> = {
  reaction: { unit: 'ms', lowerIsBetter: true, precision: 0 },
  sound: { unit: 'dB', lowerIsBetter: false, precision: 1 },
  earthquake: { unit: 'g', lowerIsBetter: true, precision: 2 },
  handfan: { unit: '°', lowerIsBetter: false, precision: 0 },
  performance: { unit: '/100', lowerIsBetter: false, precision: 0 },
  breathing: { unit: 'BPM', lowerIsBetter: true, precision: 0 },
};

export const RANKED_ACTIVITY_IDS = Object.keys(META);

export function getActivityLabel(activityId: string): string {
  const found = activities.find((a) => a.id === activityId);
  return found?.title ?? activityId;
}

export function getActivityTitleKey(activityId: string): string {
  return `activity.${activityId}.title`;
}

export function getActivityShortLabelKey(activityId: string): string {
  return `activity.${activityId}.shortLabel`;
}

export function translateActivityTitle(
  language: LanguageCode,
  activityId: string
): string {
  const key = getActivityTitleKey(activityId);
  const translated = translate(language, key);
  if (translated !== key) return translated;
  return getActivityLabel(activityId);
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
