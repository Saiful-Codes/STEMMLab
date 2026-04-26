import { Button, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSetup'>;

export default function TeamSetupScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Setup</Text>
      <Text style={styles.subtitle}>(Form fields will be added in a later phase.)</Text>
      <Button title="Continue to App" onPress={() => navigation.replace('MainTabs')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
});
