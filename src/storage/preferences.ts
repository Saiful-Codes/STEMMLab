import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type Preferences = {
  mode: ThemeMode;
  largeText: boolean;
};

const KEY = 'preferences:v1';
const DEFAULTS: Preferences = { mode: 'light', largeText: false };

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      largeText: !!parsed.largeText,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Preferences are non-critical; ignore write failures so the UI keeps working.
  }
}
