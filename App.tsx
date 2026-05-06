import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { TeamProvider } from './src/context/TeamContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { initDatabase } from './src/storage/sqliteDb';

function ThemedApp() {
  const { navTheme, mode } = useTheme();
  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    initDatabase().catch((err) => {
      console.warn('[App] SQLite init failed; app continues with AsyncStorage:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TeamProvider>
            <ThemedApp />
          </TeamProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
