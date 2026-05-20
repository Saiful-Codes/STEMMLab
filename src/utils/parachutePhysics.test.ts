import { calculateTrial, getGForceRisk } from './parachutePhysics';

describe('getGForceRisk boundaries', () => {
  it('classifies 4.9 as safe', () => {
    expect(getGForceRisk(4.9).key).toBe('safe');
  });

  it('classifies 5 as mild (boundary belongs to next band)', () => {
    expect(getGForceRisk(5).key).toBe('mild');
  });

  it('classifies 9.9 as mild', () => {
    expect(getGForceRisk(9.9).key).toBe('mild');
  });

  it('classifies 10 as moderate', () => {
    expect(getGForceRisk(10).key).toBe('moderate');
  });

  it('classifies 29.9 as moderate', () => {
    expect(getGForceRisk(29.9).key).toBe('moderate');
  });

  it('classifies 30 as severe', () => {
    expect(getGForceRisk(30).key).toBe('severe');
  });

  it('classifies 49.9 as severe', () => {
    expect(getGForceRisk(49.9).key).toBe('severe');
  });

  it('classifies 50 as extreme', () => {
    expect(getGForceRisk(50).key).toBe('extreme');
  });

  it('classifies 100 as extreme', () => {
    expect(getGForceRisk(100).key).toBe('extreme');
  });
});

describe('calculateTrial', () => {
  it('computes kinematics for the primary level (gForce stays 0)', () => {
    const result = calculateTrial(
      { fallTime: 2 },
      10, // dropHeight (m)
      0.1, // toyMass (kg)
      'primary'
    );
    // finalVelocity = 10 / 2 = 5
    // acceleration = 5 / 2 = 2.5
    // netForce = 0.1 * 2.5 = 0.25
    // weight = 0.1 * 9.8 = 0.98
    // dragForce = 0.98 - 0.25 = 0.73
    expect(result.finalVelocity).toBe(5);
    expect(result.acceleration).toBe(2.5);
    expect(result.netForce).toBe(0.25);
    expect(result.weight).toBe(0.98);
    expect(result.dragForce).toBe(0.73);
    expect(result.gForce).toBe(0);
    expect(result.gForceRisk).toBe('safe');
  });

  it('computes gForce + risk band for the highschool level (no bounce)', () => {
    const result = calculateTrial(
      { fallTime: 1, contactTime: 0.1, didBounce: false },
      9.8, // dropHeight
      1, // toyMass
      'highschool'
    );
    // finalVelocity = 9.8 / 1 = 9.8
    // gForce = 9.8 / (0.1 * 9.8) = 10 → moderate
    expect(result.finalVelocity).toBe(9.8);
    expect(result.acceleration).toBe(9.8);
    expect(result.weight).toBe(9.8);
    expect(result.gForce).toBe(10);
    expect(result.gForceRisk).toBe('moderate');
  });
});
