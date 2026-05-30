import { Result } from '../types/Result';
import {
  toNumeric,
  sortResultsForRanking,
  bestResult,
  averageResult,
} from './resultUtils';

function makeResult(partial: Partial<Result> & { result: number | string; activityId: string }): Result {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    activityId: partial.activityId,
    teamName: partial.teamName ?? 'Team A',
    members: partial.members ?? ['Alice'],
    result: partial.result,
    timestamp: partial.timestamp ?? 0,
  };
}

describe('toNumeric', () => {
  it('returns the number for numeric input', () => {
    expect(toNumeric(42)).toBe(42);
    expect(toNumeric(0)).toBe(0);
    expect(toNumeric(-3.14)).toBe(-3.14);
  });

  it('returns parsed number for numeric string', () => {
    expect(toNumeric('42')).toBe(42);
    expect(toNumeric('3.14')).toBe(3.14);
    expect(toNumeric('-2.5')).toBe(-2.5);
  });

  it('returns null for non-numeric string and for NaN', () => {
    expect(toNumeric('not a number')).toBeNull();
    expect(toNumeric('abc123')).toBeNull();
    expect(toNumeric(NaN)).toBeNull();
  });
});

describe('sortResultsForRanking', () => {
  it('orders ascending for reaction (lower is better)', () => {
    const results: Result[] = [
      makeResult({ activityId: 'reaction', result: 350 }),
      makeResult({ activityId: 'reaction', result: 180 }),
      makeResult({ activityId: 'reaction', result: 260 }),
    ];
    const sorted = sortResultsForRanking(results, 'reaction');
    expect(sorted.map((r) => r.result)).toEqual([180, 260, 350]);
  });

  it('orders descending for sound (higher is better)', () => {
    const results: Result[] = [
      makeResult({ activityId: 'sound', result: 55 }),
      makeResult({ activityId: 'sound', result: 92 }),
      makeResult({ activityId: 'sound', result: 70 }),
    ];
    const sorted = sortResultsForRanking(results, 'sound');
    expect(sorted.map((r) => r.result)).toEqual([92, 70, 55]);
  });
});

describe('bestResult', () => {
  it('returns null for non-ranked activity ids', () => {
    const results: Result[] = [
      makeResult({ activityId: 'not-an-activity', result: 12.3 }),
      makeResult({ activityId: 'not-an-activity', result: 9.8 }),
    ];
    expect(bestResult(results, 'not-an-activity')).toBeNull();
  });
});

describe('averageResult', () => {
  it('averages valid numbers and ignores non-numerics', () => {
    const results: Result[] = [
      makeResult({ activityId: 'reaction', result: 100 }),
      makeResult({ activityId: 'reaction', result: '200' }),
      makeResult({ activityId: 'reaction', result: 'invalid' }),
      makeResult({ activityId: 'reaction', result: 300 }),
    ];
    expect(averageResult(results, 'reaction')).toBe(200);
  });
});
