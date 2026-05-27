import AsyncStorage from '@react-native-async-storage/async-storage';
import { Result } from '../types/Result';
import { getResults, saveResult, clearResults } from './results';

const RESULTS_KEY = 'results';

function makeResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'r-1',
    activityId: 'reaction',
    teamName: 'Team A',
    members: ['Alice'],
    result: 200,
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe('storage/results', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('getResults returns [] when nothing is stored', async () => {
    await expect(getResults()).resolves.toEqual([]);
  });

  it('saveResult then getResults returns the saved result at index 0', async () => {
    const r = makeResult({ id: 'r-1' });
    await saveResult(r);
    const got = await getResults();
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ id: 'r-1' });
  });

  it('saving twice prepends the newest result', async () => {
    await saveResult(makeResult({ id: 'first', timestamp: 1 }));
    await saveResult(makeResult({ id: 'second', timestamp: 2 }));
    const got = await getResults();
    expect(got.map((r) => r.id)).toEqual(['second', 'first']);
  });

  it('getResults returns [] when storage contains invalid JSON (corruption fallback)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(RESULTS_KEY, '{not valid json');
    await expect(getResults()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('clearResults empties the store', async () => {
    await saveResult(makeResult());
    await clearResults();
    await expect(getResults()).resolves.toEqual([]);
  });
});
