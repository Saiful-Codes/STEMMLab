import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import {
  BACKGROUND_TASK_NAME,
  getBackgroundTaskStatus,
  getLastBackgroundRun,
} from './backgroundTaskService';

const mockedDefineTask = TaskManager.defineTask as jest.MockedFunction<
  typeof TaskManager.defineTask
>;
const mockedIsTaskRegistered = TaskManager.isTaskRegisteredAsync as jest.MockedFunction<
  typeof TaskManager.isTaskRegisteredAsync
>;
const mockedGetStatus = BackgroundFetch.getStatusAsync as jest.MockedFunction<
  typeof BackgroundFetch.getStatusAsync
>;

describe('module side-effect', () => {
  it('registers the background task name with TaskManager.defineTask at import time', () => {
    expect(mockedDefineTask).toHaveBeenCalled();
    const firstCall = mockedDefineTask.mock.calls[0];
    expect(firstCall[0]).toBe(BACKGROUND_TASK_NAME);
    expect(typeof firstCall[1]).toBe('function');
  });
});

describe('getBackgroundTaskStatus', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns available: true / "Available" when the OS reports Available and the task is registered', async () => {
    mockedGetStatus.mockResolvedValueOnce(
      BackgroundFetch.BackgroundFetchStatus.Available as never
    );
    mockedIsTaskRegistered.mockResolvedValueOnce(true as never);

    const status = await getBackgroundTaskStatus();

    expect(status).toEqual({
      available: true,
      statusLabel: 'Available',
      registered: true,
    });
  });

  it('returns available: false / "Denied" when the OS denies background fetch', async () => {
    mockedGetStatus.mockResolvedValueOnce(
      BackgroundFetch.BackgroundFetchStatus.Denied as never
    );
    mockedIsTaskRegistered.mockResolvedValueOnce(false as never);

    const status = await getBackgroundTaskStatus();

    expect(status).toEqual({
      available: false,
      statusLabel: 'Denied',
      registered: false,
    });
  });

  it('falls back to "Unknown" and registered: false when both native calls throw', async () => {
    mockedGetStatus.mockRejectedValueOnce(new Error('native unavailable'));
    mockedIsTaskRegistered.mockRejectedValueOnce(new Error('native unavailable'));

    const status = await getBackgroundTaskStatus();

    expect(status).toEqual({
      available: false,
      statusLabel: 'Unknown',
      registered: false,
    });
  });
});

describe('getLastBackgroundRun', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns { lastRunAt: null, runCount: 0 } when AsyncStorage is empty', async () => {
    const info = await getLastBackgroundRun();
    expect(info).toEqual({ lastRunAt: null, runCount: 0 });
  });

  it('parses persisted lastRunAt and runCount from AsyncStorage', async () => {
    await AsyncStorage.multiSet([
      ['background:last_run', '1700000000000'],
      ['background:run_count', '7'],
    ]);

    const info = await getLastBackgroundRun();

    expect(info).toEqual({ lastRunAt: 1700000000000, runCount: 7 });
  });
});
