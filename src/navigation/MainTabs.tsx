import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ActivityStack from './ActivityStack';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type MainTabsParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ActivityStack} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
