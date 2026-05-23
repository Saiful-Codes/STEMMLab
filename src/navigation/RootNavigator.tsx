import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createNavigationContainerRef } from '@react-navigation/native';
import { NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import TeamSetupScreen from '../screens/onboarding/TeamSetupScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import MainTabs from './MainTabs';
import { useTeam } from '../context/TeamContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';

export type RootStackParamList = {
  Welcome: undefined;
  TeamSetup: undefined;
  MainTabs: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Global navigation ref for notification handling

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export default function RootNavigator() {
  const { team, loading: teamLoading } = useTeam();
  const { loading: themeLoading, colors } = useTheme();
  const { t } = useTranslation();

  // Set up notification response handling for deep linking
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      console.log('[RootNavigator] Notification response with screen:', screen);
      
      if (screen === 'History' && navigationRef.isReady()) {
        // Navigate to MainTabs and then to History tab
        navigationRef.navigate('MainTabs', {
          screen: 'History',
        } as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (teamLoading || themeLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {team ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Account' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TeamSetup"
            component={TeamSetupScreen}
            options={{ title: t('nav.teamSetup') }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Account' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
