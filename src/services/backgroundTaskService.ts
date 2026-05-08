import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// IMPORTANT: `defineTask` must run at module top-level so the JS runtime knows
// about the task BEFORE the OS asks the app to execute it. This file is
// imported for its side-effect from App.tsx — keep that import in place.
//
// Expo Go limitation (SDK 53+): expo-background-fetch and expo-task-manager
// are NOT supported in Expo Go. Registering will throw and the task body will
// never fire. Run a development build (`npx expo run:android` / `run:ios`, or
// EAS Build) to actually exercise this. On iOS dev builds you also need
// `ios.infoPlist.UIBackgroundModes: ["fetch"]` in app.json.

export const BACKGROUND_TASK_NAME = 'STEMMLAB_BACKGROUND_TASK';

const LAST_RUN_KEY = 'background:last_run';
const RUN_COUNT_KEY = 'background:run_count';
const DEFAULT_INTERVAL_SECONDS = 60 * 15; // 15 min — OS may delay further

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const now = Date.now();
    const prevCountRaw = await AsyncStorage.getItem(RUN_COUNT_KEY);
    const prevCount = prevCountRaw ? parseInt(prevCountRaw, 10) : 0;
    const nextCount = Number.isNaN(prevCount) ? 1 : prevCount + 1;

    await AsyncStorage.multiSet([
      [LAST_RUN_KEY, String(now)],
      [RUN_COUNT_KEY, String(nextCount)],
    ]);

    console.log('[backgroundTask] tick', {
      at: new Date(now).toISOString(),
      count: nextCount,
    });
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.warn('[backgroundTask] task body failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export type BackgroundTaskStatus = {
  available: boolean;
  statusLabel: 'Available' | 'Denied' | 'Restricted' | 'Unknown';
  registered: boolean;
};

export type BackgroundRunInfo = {
  lastRunAt: number | null;
  runCount: number;
};

function statusLabelFor(
  status: BackgroundFetch.BackgroundFetchStatus | null
): BackgroundTaskStatus['statusLabel'] {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'Available';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'Denied';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'Restricted';
    default:
      return 'Unknown';
  }
}

export async function registerBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );
    if (isRegistered) {
      console.log('[backgroundTask] register: already registered');
      return;
    }
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: DEFAULT_INTERVAL_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[backgroundTask] register: ok');
  } catch (err) {
    console.warn('[backgroundTask] registerBackgroundTask failed:', err);
    throw err;
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TASK_NAME
    );
    if (!isRegistered) {
      console.log('[backgroundTask] unregister: not registered, skip');
      return;
    }
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    console.log('[backgroundTask] unregister: ok');
  } catch (err) {
    console.warn('[backgroundTask] unregisterBackgroundTask failed:', err);
    throw err;
  }
}

export async function getBackgroundTaskStatus(): Promise<BackgroundTaskStatus> {
  let osStatus: BackgroundFetch.BackgroundFetchStatus | null = null;
  try {
    osStatus = await BackgroundFetch.getStatusAsync();
  } catch (err) {
    console.warn('[backgroundTask] getStatusAsync failed:', err);
    osStatus = null;
  }

  let registered = false;
  try {
    registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  } catch (err) {
    console.warn('[backgroundTask] isTaskRegisteredAsync failed:', err);
    registered = false;
  }

  return {
    available: osStatus === BackgroundFetch.BackgroundFetchStatus.Available,
    statusLabel: statusLabelFor(osStatus),
    registered,
  };
}

export async function getLastBackgroundRun(): Promise<BackgroundRunInfo> {
  try {
    const pairs = await AsyncStorage.multiGet([LAST_RUN_KEY, RUN_COUNT_KEY]);
    const lastRaw = pairs[0]?.[1] ?? null;
    const countRaw = pairs[1]?.[1] ?? null;

    const lastRunAt = lastRaw ? Number(lastRaw) : null;
    const runCount = countRaw ? Number(countRaw) : 0;

    return {
      lastRunAt:
        lastRunAt !== null && !Number.isNaN(lastRunAt) ? lastRunAt : null,
      runCount: Number.isNaN(runCount) ? 0 : runCount,
    };
  } catch (err) {
    console.warn('[backgroundTask] getLastBackgroundRun failed:', err);
    return { lastRunAt: null, runCount: 0 };
  }
}
