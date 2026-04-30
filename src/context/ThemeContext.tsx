import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import {
  Colors,
  baseFont,
  darkColors,
  FontKey,
  lightColors,
} from '../theme/tokens';
import {
  loadPreferences,
  Preferences,
  savePreferences,
  ThemeMode,
} from '../storage/preferences';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: Colors;
  largeText: boolean;
  fontScale: number;
  fs: (key: FontKey) => number;
  navTheme: Theme;
  loading: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setLargeText: (value: boolean) => void;
  toggleLargeText: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [largeText, setLargeTextState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (cancelled) return;
      setModeState(prefs.mode);
      setLargeTextState(prefs.largeText);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Partial<Preferences>) => {
    void savePreferences(next);
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      persist({ mode: next, largeText });
    },
    [largeText, persist]
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      persist({ mode: next, largeText });
      return next;
    });
  }, [largeText, persist]);

  const setLargeText = useCallback(
    (value: boolean) => {
      setLargeTextState(value);
      persist({ mode, largeText: value });
    },
    [mode, persist]
  );

  const toggleLargeText = useCallback(() => {
    setLargeTextState((prev) => {
      const next = !prev;
      persist({ mode, largeText: next });
      return next;
    });
  }, [mode, persist]);

  const fontScale = largeText ? 1.25 : 1;
  const colors = mode === 'dark' ? darkColors : lightColors;

  const fs = useCallback(
    (key: FontKey) => baseFont[key] * fontScale,
    [fontScale]
  );

  const navTheme = useMemo<Theme>(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
        notification: colors.accent,
      },
    };
  }, [mode, colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors,
      largeText,
      fontScale,
      fs,
      navTheme,
      loading,
      setMode,
      toggleMode,
      setLargeText,
      toggleLargeText,
    }),
    [
      mode,
      colors,
      largeText,
      fontScale,
      fs,
      navTheme,
      loading,
      setMode,
      toggleMode,
      setLargeText,
      toggleLargeText,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
