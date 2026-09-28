import React from 'react';
import { View, StyleSheet, ActivityIndicator, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';
import { colors } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { Header, BottomNav } from './src/components/Shell';
import { WizardScreen } from './src/screens/WizardScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { ItineraryScreen } from './src/screens/ItineraryScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { TodoScreen } from './src/screens/TodoScreen';

// Force RTL for the Hebrew UI.
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch {
    /* no-op on web */
  }
}

function Screens() {
  const { tab } = useStore();
  return (
    <View style={styles.screen}>
      {tab === 'wizard' && <WizardScreen />}
      {tab === 'results' && <ResultsScreen />}
      {tab === 'budget' && <BudgetScreen />}
      {tab === 'itinerary' && <ItineraryScreen />}
      {tab === 'admin' && <AdminScreen />}
      {tab === 'todo' && <TodoScreen />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <StoreProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.frame}>
          <Header />
          <Screens />
          <BottomNav />
        </View>
      </SafeAreaView>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  // Full-width shell; screens center their own content via <Container>.
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surface,
  },
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
