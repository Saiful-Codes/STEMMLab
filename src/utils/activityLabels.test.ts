import {
  formatResult,
  isLowerBetter,
  formatTimestamp,
  isRankedActivity,
} from './activityLabels';

describe('formatResult', () => {
  it('formats reaction with precision 0 and ms unit', () => {
    expect(formatResult('reaction', 250)).toBe('250 ms');
    expect(formatResult('reaction', 250.7)).toBe('251 ms');
  });

  it('formats sound with precision 1 and dB unit', () => {
    expect(formatResult('sound', 87.65)).toBe('87.7 dB');
    expect(formatResult('sound', 60)).toBe('60.0 dB');
  });

  it('formats earthquake with precision 2 and g unit', () => {
    expect(formatResult('earthquake', 0.123)).toBe('0.12 g');
    expect(formatResult('earthquake', 1)).toBe('1.00 g');
  });

  it('formats handfan with precision 0 and ° unit', () => {
    expect(formatResult('handfan', 45.7)).toBe('46 °');
    expect(formatResult('handfan', 0)).toBe('0 °');
  });

  it('returns the string as-is for non-numeric input', () => {
    expect(formatResult('reaction', 'N/A')).toBe('N/A');
    expect(formatResult('sound', 'pending')).toBe('pending');
  });
});

describe('isLowerBetter', () => {
  it('returns true for reaction', () => {
    expect(isLowerBetter('reaction')).toBe(true);
  });

  it('returns true for earthquake', () => {
    expect(isLowerBetter('earthquake')).toBe(true);
  });

  it('returns false for sound', () => {
    expect(isLowerBetter('sound')).toBe(false);
  });

  it('returns false for handfan', () => {
    expect(isLowerBetter('handfan')).toBe(false);
  });

  it('returns true for parachute', () => {
    expect(isLowerBetter('parachute')).toBe(true);
  });

  it('returns false (default) for unknown activity id', () => {
    expect(isLowerBetter('not-an-activity')).toBe(false);
  });
});

describe('isRankedActivity', () => {
  it('is true only for the ranked activities', () => {
    expect(isRankedActivity('reaction')).toBe(true);
    expect(isRankedActivity('sound')).toBe(true);
    expect(isRankedActivity('earthquake')).toBe(true);
    expect(isRankedActivity('handfan')).toBe(true);
    expect(isRankedActivity('performance')).toBe(true);
    expect(isRankedActivity('breathing')).toBe(true);
    expect(isRankedActivity('parachute')).toBe(true);
  });
});

describe('formatTimestamp', () => {
  it('returns a non-empty string for a known epoch', () => {
    const out = formatTimestamp(1700000000000);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for epoch 0', () => {
    const out = formatTimestamp(0);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});
