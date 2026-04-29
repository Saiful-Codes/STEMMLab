import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { TeamProvider } from './src/context/TeamContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

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
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TeamProvider>
          <ThemedApp />
        </TeamProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
