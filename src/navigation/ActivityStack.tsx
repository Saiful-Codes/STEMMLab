import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ActivityDetailScreen from '../screens/activity/ActivityDetailScreen';
import ActivityRunScreen from '../screens/activity/ActivityRunScreen';
import ActivityResultScreen from '../screens/activity/ActivityResultScreen';

export type ActivityStackParamList = {
  Home: undefined;
  ActivityDetail: { activityId: string };
  ActivityRun: { activityId: string };
  ActivityResult: { activityId: string };
};

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity' }}
      />
      <Stack.Screen
        name="ActivityRun"
        component={ActivityRunScreen}
        options={{ title: 'Run Activity' }}
      />
      <Stack.Screen
        name="ActivityResult"
        component={ActivityResultScreen}
        options={{ title: 'Results' }}
      />
    </Stack.Navigator>
  );
}
