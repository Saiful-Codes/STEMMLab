import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { TeamProvider } from './src/context/TeamContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <TeamProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </TeamProvider>
    </SafeAreaProvider>
  );
}
