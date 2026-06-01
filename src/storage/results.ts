import AsyncStorage from '@react-native-async-storage/async-storage';
import { Result } from '../types/Result';

const RESULTS_KEY = 'results';

export async function getResults(): Promise<Result[]> {
  try {
    const raw = await AsyncStorage.getItem(RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Result[]) : [];
  } catch (err) {
    console.warn('[storage/results] getResults parse failed; returning []:', err);
    return [];
  }
}

export async function saveResult(result: Result): Promise<void> {
  try {
    const existing = await getResults();
    const updated = [result, ...existing];
    await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[storage/results] saveResult failed:', err);
    throw err;
  }
}

export async function clearResults(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESULTS_KEY);
  } catch (err) {
    console.warn('[storage/results] clearResults failed:', err);
    throw err;
  }
}

export async function replaceAllResults(results: Result[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (err) {
    console.warn('[storage/results] replaceAllResults failed:', err);
    throw err;
  }
}
