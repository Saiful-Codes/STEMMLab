import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ActivityListScreen from '../screens/activity/ActivityListScreen';
import ActivityDetailScreen from '../screens/activity/ActivityDetailScreen';
import ActivityRunScreen from '../screens/activity/ActivityRunScreen';
import ActivityResultScreen from '../screens/activity/ActivityResultScreen';
import ResultSummaryScreen from '../screens/common/ResultSummaryScreen';
import { useTranslation } from '../context/LanguageContext';

export type ActivityStackParamList = {
  Dashboard: undefined;
  ActivityList: undefined;
  ActivityDetail: { activityId: string };
  ActivityRun: { activityId: string };
  ActivityResult: { activityId: string };
  ResultSummary: { activityId: string; result: number | string };
};

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityList"
        component={ActivityListScreen}
        options={{ title: t('home.heading') }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: t('nav.activityDetail') }}
      />
      <Stack.Screen
        name="ActivityRun"
        component={ActivityRunScreen}
        options={{ title: t('nav.activityRun') }}
      />
      <Stack.Screen
        name="ActivityResult"
        component={ActivityResultScreen}
        options={{ title: t('nav.activityResult') }}
      />
      <Stack.Screen
        name="ResultSummary"
        component={ResultSummaryScreen}
        options={{ title: t('nav.resultSummary') }}
      />
    </Stack.Navigator>
  );
}
