import {
  shakeMagnitude,
  computeSmoothness,
  bucketFromPeak,
  BUCKET_THRESHOLDS,
  SMOOTHNESS_SCALE,
} from './performanceMetrics';

describe('shakeMagnitude', () => {
  it('returns 0 for a perfectly still phone reading exactly 1g on one axis', () => {
    expect(shakeMagnitude(0, 0, 1)).toBe(0);
    expect(shakeMagnitude(1, 0, 0)).toBe(0);
  });

  it('returns the deviation from 1g for off-rest readings', () => {
    expect(shakeMagnitude(0, 0, 2)).toBeCloseTo(1, 5);
    expect(shakeMagnitude(0, 0, 0)).toBeCloseTo(1, 5);
  });

  it('is symmetric around 1g (above and below)', () => {
    const above = shakeMagnitude(0, 0, 1.5);
    const below = shakeMagnitude(0, 0, 0.5);
    expect(above).toBeCloseTo(below, 5);
  });
});

describe('computeSmoothness', () => {
  it('returns 100 when no movement was sampled (samples <= 1)', () => {
    expect(computeSmoothness(0, 0)).toBe(100);
    expect(computeSmoothness(5, 1)).toBe(100);
  });

  it('returns 100 for a perfectly still recording (zero delta)', () => {
    expect(computeSmoothness(0, 50)).toBe(100);
  });

  it('returns 0 for a brisk shake (mean delta >= 0.5)', () => {
    // meanDelta = 0.5 → 100 - 200*0.5 = 0
    expect(computeSmoothness(0.5 * 9, 10)).toBe(0);
    // anything bigger still clamps to 0
    expect(computeSmoothness(100, 10)).toBe(0);
  });

  it('is linear between 0 and 0.5 meanDelta', () => {
    // meanDelta = 0.25 → 100 - 200*0.25 = 50
    expect(computeSmoothness(0.25 * 9, 10)).toBe(50);
    // meanDelta = 0.1 → 100 - 200*0.1 = 80
    expect(computeSmoothness(0.1 * 9, 10)).toBe(80);
  });

  it('respects the SMOOTHNESS_SCALE constant', () => {
    // verifies the formula uses the exported constant, not a hidden value
    const samples = 11;
    const sumDelta = 0.2 * (samples - 1);
    const expected = Math.round(100 - SMOOTHNESS_SCALE * 0.2);
    expect(computeSmoothness(sumDelta, samples)).toBe(expected);
  });
});

describe('bucketFromPeak', () => {
  it('returns low below the low threshold', () => {
    expect(bucketFromPeak(0)).toBe('low');
    expect(bucketFromPeak(BUCKET_THRESHOLDS.low - 0.001)).toBe('low');
  });

  it('returns medium at the low boundary and below the high boundary', () => {
    expect(bucketFromPeak(BUCKET_THRESHOLDS.low)).toBe('medium');
    expect(bucketFromPeak(BUCKET_THRESHOLDS.high - 0.001)).toBe('medium');
  });

  it('returns high at and above the high boundary', () => {
    expect(bucketFromPeak(BUCKET_THRESHOLDS.high)).toBe('high');
    expect(bucketFromPeak(5)).toBe('high');
  });
});
