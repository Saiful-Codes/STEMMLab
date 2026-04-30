import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLanguageCode, LanguageCode } from '../i18n/translations';

export type ThemeMode = 'light' | 'dark';

export type Preferences = {
  mode: ThemeMode;
  largeText: boolean;
  language: LanguageCode;
};

const KEY = 'preferences:v1';
const DEFAULTS: Preferences = { mode: 'light', largeText: false, language: 'en' };

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      largeText: !!parsed.largeText,
      language: isLanguageCode(parsed.language) ? parsed.language : 'en',
    };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(
  partial: Partial<Preferences>
): Promise<void> {
  try {
    const existing = await loadPreferences();
    const merged: Preferences = { ...existing, ...partial };
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Preferences are non-critical; ignore write failures so the UI keeps working.
  }
}
