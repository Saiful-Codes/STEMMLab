import * as Battery from 'expo-battery';
import { getBatteryStatus } from './batteryService';

const mockedGetLevel = Battery.getBatteryLevelAsync as jest.MockedFunction<
  typeof Battery.getBatteryLevelAsync
>;
const mockedGetState = Battery.getBatteryStateAsync as jest.MockedFunction<
  typeof Battery.getBatteryStateAsync
>;
const mockedGetLowPower = Battery.isLowPowerModeEnabledAsync as jest.MockedFunction<
  typeof Battery.isLowPowerModeEnabledAsync
>;

describe('getBatteryStatus', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns the documented fallback shape when every battery API throws (simulator/unavailable case)', async () => {
    mockedGetLevel.mockRejectedValueOnce(new Error('unavailable'));
    mockedGetState.mockRejectedValueOnce(new Error('unavailable'));
    mockedGetLowPower.mockRejectedValueOnce(new Error('unavailable'));

    const status = await getBatteryStatus();

    expect(status).toEqual({
      levelPercent: null,
      state: Battery.BatteryState.UNKNOWN,
      stateLabel: 'Unknown',
      isCharging: false,
      lowPowerMode: null,
    });
  });

  it('returns levelPercent: null when getBatteryLevelAsync resolves to a negative sentinel (-1)', async () => {
    mockedGetLevel.mockResolvedValueOnce(-1 as never);
    mockedGetState.mockResolvedValueOnce(Battery.BatteryState.UNKNOWN as never);
    mockedGetLowPower.mockResolvedValueOnce(null as never);

    const status = await getBatteryStatus();

    expect(status.levelPercent).toBeNull();
    expect(status.stateLabel).toBe('Unknown');
    expect(status.isCharging).toBe(false);
    expect(status.lowPowerMode).toBeNull();
  });

  it('maps CHARGING state to isCharging: true and stateLabel: "Charging"', async () => {
    mockedGetLevel.mockResolvedValueOnce(0.42 as never);
    mockedGetState.mockResolvedValueOnce(Battery.BatteryState.CHARGING as never);
    mockedGetLowPower.mockResolvedValueOnce(false as never);

    const status = await getBatteryStatus();

    expect(status).toEqual({
      levelPercent: 42,
      state: Battery.BatteryState.CHARGING,
      stateLabel: 'Charging',
      isCharging: true,
      lowPowerMode: false,
    });
  });

  it('maps FULL state to isCharging: true (treated as plugged-in)', async () => {
    mockedGetLevel.mockResolvedValueOnce(1 as never);
    mockedGetState.mockResolvedValueOnce(Battery.BatteryState.FULL as never);
    mockedGetLowPower.mockResolvedValueOnce(false as never);

    const status = await getBatteryStatus();

    expect(status.stateLabel).toBe('Full');
    expect(status.isCharging).toBe(true);
    expect(status.levelPercent).toBe(100);
  });

  it('maps UNPLUGGED state to "On battery" and isCharging: false', async () => {
    mockedGetLevel.mockResolvedValueOnce(0.78 as never);
    mockedGetState.mockResolvedValueOnce(Battery.BatteryState.UNPLUGGED as never);
    mockedGetLowPower.mockResolvedValueOnce(true as never);

    const status = await getBatteryStatus();

    expect(status).toEqual({
      levelPercent: 78,
      state: Battery.BatteryState.UNPLUGGED,
      stateLabel: 'On battery',
      isCharging: false,
      lowPowerMode: true,
    });
  });
});
