import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import TeamSetupScreen from '../screens/onboarding/TeamSetupScreen';
import MainTabs from './MainTabs';
import { useTeam } from '../context/TeamContext';
import { useTheme } from '../context/ThemeContext';

export type RootStackParamList = {
  Welcome: undefined;
  TeamSetup: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { team, loading: teamLoading } = useTeam();
  const { loading: themeLoading, colors } = useTheme();

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
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
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
            options={{ title: 'Team Setup' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
