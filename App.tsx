import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import RootNavigator, { navigationRef } from './src/navigation/RootNavigator';
import { TeamProvider } from './src/context/TeamContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { LocationProvider } from './src/context/LocationContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { initDatabase } from './src/storage/sqliteDb';
import { requestNotificationPermissions, setupNotificationResponseListener } from './src/services/notificationService';
// Side-effect import: registers the background task definition with TaskManager
// at JS startup so the OS can locate it when the task fires. Don't remove.
import './src/services/backgroundTaskService';

function ThemedApp() {
  const { navTheme, mode } = useTheme();

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
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

  useEffect(() => {
    let subscription: Notifications.EventSubscription | undefined;

    (async () => {
      try {
        await requestNotificationPermissions();
        subscription = setupNotificationResponseListener((data) => {
          console.log('[App] Notification response data:', data);
        });
      } catch (err) {
        console.warn('[App] Failed to set up notifications:', err);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <NotificationProvider>
            <LocationProvider>
              <TeamProvider>
                <ThemedApp />
              </TeamProvider>
            </LocationProvider>
          </NotificationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
