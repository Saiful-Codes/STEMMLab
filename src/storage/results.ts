import AsyncStorage from '@react-native-async-storage/async-storage';
import { Result } from '../types/Result';

const RESULTS_KEY = 'results';

export async function getResults(): Promise<Result[]> {
  const raw = await AsyncStorage.getItem(RESULTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Result[];
  } catch {
    return [];
  }
}

export async function saveResult(result: Result): Promise<void> {
  const existing = await getResults();
  const updated = [result, ...existing];
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
}

export async function clearResults(): Promise<void> {
  await AsyncStorage.removeItem(RESULTS_KEY);
}
