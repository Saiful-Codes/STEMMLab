import { HandFanTrialResult } from '../storage/attempts';

export type MaterialInfo = {
  key: string;
  label: string;
  thickness: number;
  stiffness: number;
};

export const MATERIALS: MaterialInfo[] = [
  { key: 'thinPaper', label: 'Thin Printer Paper', thickness: 0.1, stiffness: 0.05 },
  { key: 'cardStock', label: 'Standard Card Stock', thickness: 0.25, stiffness: 0.2 },
  { key: 'thinCardboard', label: 'Thin Cardboard', thickness: 0.5, stiffness: 0.5 },
  { key: 'corrugatedCardboard', label: 'Corrugated Cardboard', thickness: 3.0, stiffness: 2.5 },
];

export const DISTANCES = [15, 30, 45];

export function getMaterial(key: string): MaterialInfo | undefined {
  return MATERIALS.find((m) => m.key === key);
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateForce(
  stiffness: number,
  angleDegrees: number,
): HandFanTrialResult {
  const bendAngleRad = degreesToRadians(angleDegrees);
  const estimatedForce = stiffness * bendAngleRad;
  return {
    bendAngleRad: round2(bendAngleRad),
    estimatedForce: round2(estimatedForce),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
