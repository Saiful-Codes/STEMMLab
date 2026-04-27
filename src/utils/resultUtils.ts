import { Result } from '../types/Result';
import { isLowerBetter, isRankedActivity } from './activityLabels';

export function toNumeric(value: number | string): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function sortResultsForRanking(results: Result[], activityId: string): Result[] {
  const lower = isLowerBetter(activityId);
  return [...results]
    .filter((r) => toNumeric(r.result) !== null)
    .sort((a, b) => {
      const an = toNumeric(a.result) as number;
      const bn = toNumeric(b.result) as number;
      return lower ? an - bn : bn - an;
    });
}

export function bestResult(results: Result[], activityId: string): number | null {
  if (!isRankedActivity(activityId)) return null;
  const sorted = sortResultsForRanking(results, activityId);
  if (sorted.length === 0) return null;
  return toNumeric(sorted[0].result);
}

export function averageResult(results: Result[], activityId: string): number | null {
  const nums = results
    .map((r) => toNumeric(r.result))
    .filter((n): n is number => n !== null);
  if (nums.length === 0) return null;
  const sum = nums.reduce((acc, n) => acc + n, 0);
  return sum / nums.length;
}

export function groupByActivity(results: Result[]): Record<string, Result[]> {
  return results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.activityId]) acc[r.activityId] = [];
    acc[r.activityId].push(r);
    return acc;
  }, {});
}
