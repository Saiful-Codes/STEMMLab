import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ActivityStack from './ActivityStack';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { useTranslation } from '../context/LanguageContext';

export type MainTabsParamList = {
  Home: undefined;
  Leaderboard: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={ActivityStack}
        options={{ tabBarLabel: t('tab.home') }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: t('tab.leaderboard') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: t('tab.history') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tab.settings') }}
      />
    </Tab.Navigator>
  );
}
