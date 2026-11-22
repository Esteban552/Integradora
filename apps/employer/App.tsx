import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from './src/theme';

/**
 * Pantalla en blanco inicial (Fase 0).
 * En Fase 1 se conectará la navegación de `src/navigation/` y las pantallas UI-EMP-01..14.
 */
export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
});
