import {
  ParachuteTrialInput,
  ParachuteTrialResult,
  StudentLevel,
} from '../storage/attempts';

const GRAVITY = 9.8;

export type GForceRiskLevel = 'safe' | 'mild' | 'moderate' | 'severe' | 'extreme';

export type GForceRangeInfo = {
  key: GForceRiskLevel;
  min: number;
  max: number;
  label: string;
  example: string;
  color: string;
  bgColor: string;
};

export const G_FORCE_RANGES: GForceRangeInfo[] = [
  {
    key: 'safe',
    min: 0,
    max: 5,
    label: 'No Injury',
    example: 'Standing up quickly, elevator rides',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    key: 'mild',
    min: 5,
    max: 10,
    label: 'Possible Bruising',
    example: 'Hard falls while running, minor car braking',
    color: '#b45309',
    bgColor: '#fef3c7',
  },
  {
    key: 'moderate',
    min: 10,
    max: 30,
    label: 'Serious Injuries Possible',
    example: 'Sports collisions, bicycle crashes',
    color: '#c2410c',
    bgColor: '#ffedd5',
  },
  {
    key: 'severe',
    min: 30,
    max: 50,
    label: 'High Risk Severe Injury',
    example: 'Severe car crashes, falls onto hard surfaces',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  {
    key: 'extreme',
    min: 50,
    max: Infinity,
    label: 'Life-Threatening',
    example: 'Very sudden stops with no cushioning',
    color: '#7f1d1d',
    bgColor: '#fecaca',
  },
];

export function getGForceRisk(gForce: number): GForceRangeInfo {
  for (const range of G_FORCE_RANGES) {
    if (gForce < range.max) return range;
  }
  return G_FORCE_RANGES[G_FORCE_RANGES.length - 1];
}

export function calculateTrial(
  input: ParachuteTrialInput,
  dropHeight: number,
  toyMass: number,
  level: StudentLevel,
): ParachuteTrialResult {
  const finalVelocity = dropHeight / input.fallTime;
  const acceleration = finalVelocity / input.fallTime;
  const netForce = toyMass * acceleration;
  const weight = toyMass * GRAVITY;
  const dragForce = weight - netForce;

  let gForce = 0;
  let gForceRisk: string = 'safe';

  if (level === 'highschool' && input.contactTime != null && input.contactTime > 0) {
    let deltaV = finalVelocity;
    if (input.didBounce && input.bounceTime != null && input.bounceTime > 0) {
      const vUp = GRAVITY * input.bounceTime;
      deltaV = finalVelocity + vUp;
    }
    gForce = deltaV / (input.contactTime * GRAVITY);
    gForceRisk = getGForceRisk(gForce).key;
  }

  return {
    finalVelocity: round2(finalVelocity),
    acceleration: round2(acceleration),
    netForce: round2(netForce),
    weight: round2(weight),
    dragForce: round2(dragForce),
    gForce: round2(gForce),
    gForceRisk,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
