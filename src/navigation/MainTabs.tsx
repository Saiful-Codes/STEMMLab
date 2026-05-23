import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function MainTabs() {
  const { t } = useTranslation();

  const renderIcon =
    (name: IoniconName) =>
    ({ color, size }: { color: string; size: number }) =>
      <Ionicons name={name} size={size} color={color} />;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={ActivityStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
          return {
            tabBarLabel: t('tab.home'),
            tabBarIcon: renderIcon('home-outline'),
            tabBarStyle:
              routeName === 'Dashboard' ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: t('tab.leaderboard'),
          tabBarIcon: renderIcon('trophy-outline'),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('tab.history'),
          tabBarIcon: renderIcon('time-outline'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tab.settings'),
          tabBarIcon: renderIcon('settings-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
