import * as Battery from 'expo-battery';

export type BatteryStateLabel =
  | 'Charging'
  | 'Full'
  | 'On battery'
  | 'Unknown';

export type BatteryStatus = {
  levelPercent: number | null;
  state: Battery.BatteryState;
  stateLabel: BatteryStateLabel;
  isCharging: boolean;
  lowPowerMode: boolean | null;
};

function stateLabelFor(state: Battery.BatteryState): BatteryStateLabel {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return 'Charging';
    case Battery.BatteryState.FULL:
      return 'Full';
    case Battery.BatteryState.UNPLUGGED:
      return 'On battery';
    default:
      return 'Unknown';
  }
}

export async function getBatteryStatus(): Promise<BatteryStatus> {
  let levelPercent: number | null = null;
  try {
    const level = await Battery.getBatteryLevelAsync();
    levelPercent = level >= 0 ? Math.round(level * 100) : null;
  } catch (err) {
    console.warn('[batteryService] getBatteryLevelAsync unavailable:', err);
    levelPercent = null;
  }

  let state: Battery.BatteryState = Battery.BatteryState.UNKNOWN;
  try {
    state = await Battery.getBatteryStateAsync();
  } catch (err) {
    console.warn('[batteryService] getBatteryStateAsync unavailable:', err);
    state = Battery.BatteryState.UNKNOWN;
  }

  let lowPowerMode: boolean | null = null;
  try {
    lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
  } catch (err) {
    console.warn('[batteryService] isLowPowerModeEnabledAsync unavailable:', err);
    lowPowerMode = null;
  }

  const isCharging =
    state === Battery.BatteryState.CHARGING ||
    state === Battery.BatteryState.FULL;

  return {
    levelPercent,
    state,
    stateLabel: stateLabelFor(state),
    isCharging,
    lowPowerMode,
  };
}
