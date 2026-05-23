import { PerformanceBucket } from '../storage/attempts';

// Phone at rest reads ~1g on its dominant axis. The "shake" component is the
// deviation of the total acceleration vector magnitude from 1g.
export function shakeMagnitude(x: number, y: number, z: number): number {
  const total = Math.sqrt(x * x + y * y + z * z);
  return Math.abs(total - 1);
}

// Tunable constants — adjust after device testing without touching UI code.
export const SMOOTHNESS_SCALE = 200;

export const BUCKET_THRESHOLDS = { low: 0.3, high: 0.8 } as const;

// Smoothness: 100 = perfectly still, 0 = brisk shake. Linear mapping based on
// average frame-to-frame change in shake magnitude.
export function computeSmoothness(sumDelta: number, samples: number): number {
  if (samples <= 1) return 100;
  const meanDelta = sumDelta / (samples - 1);
  const raw = 100 - SMOOTHNESS_SCALE * meanDelta;
  const clamped = Math.max(0, Math.min(100, raw));
  return Math.round(clamped);
}

export function bucketFromPeak(peak: number): PerformanceBucket {
  if (peak < BUCKET_THRESHOLDS.low) return 'low';
  if (peak < BUCKET_THRESHOLDS.high) return 'medium';
  return 'high';
}
