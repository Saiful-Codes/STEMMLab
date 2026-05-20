import {
  degreesToRadians,
  getMaterial,
  calculateForce,
  MATERIALS,
} from './handFanPhysics';

describe('degreesToRadians', () => {
  it('returns ≈ π for 180°', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
  });

  it('returns 0 for 0°', () => {
    expect(degreesToRadians(0)).toBe(0);
  });

  it('returns ≈ π/2 for 90°', () => {
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('getMaterial', () => {
  it('returns the material info for a known key', () => {
    const m = getMaterial('thinCardboard');
    expect(m).toBeDefined();
    expect(m).toMatchObject({
      key: 'thinCardboard',
      label: 'Thin Cardboard',
      thickness: 0.5,
      stiffness: 0.5,
    });
  });

  it('returns undefined for an unknown key', () => {
    expect(getMaterial('not-a-material')).toBeUndefined();
    expect(getMaterial('')).toBeUndefined();
  });

  it('finds every material defined in MATERIALS', () => {
    for (const m of MATERIALS) {
      expect(getMaterial(m.key)).toBe(m);
    }
  });
});

describe('calculateForce', () => {
  it('returns expected bendAngleRad and estimatedForce for thinCardboard @ 90°', () => {
    // stiffness 0.5, 90° → π/2 ≈ 1.5708 → round2 = 1.57
    // estimatedForce = 0.5 * 1.5708 ≈ 0.7854 → round2 = 0.79
    const result = calculateForce(0.5, 90);
    expect(result.bendAngleRad).toBe(1.57);
    expect(result.estimatedForce).toBe(0.79);
  });

  it('returns 0 force for 0° regardless of stiffness', () => {
    const result = calculateForce(2.5, 0);
    expect(result.bendAngleRad).toBe(0);
    expect(result.estimatedForce).toBe(0);
  });

  it('scales linearly with stiffness at fixed angle', () => {
    const low = calculateForce(0.05, 45); // thin paper
    const high = calculateForce(2.5, 45); // corrugated
    expect(high.estimatedForce).toBeGreaterThan(low.estimatedForce);
    expect(high.bendAngleRad).toBe(low.bendAngleRad);
  });
});
