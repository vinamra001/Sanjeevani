import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/utils/DatabaseInit';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  React.useEffect(() => {
    initDatabase();
  }, []);

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        {/* This View is CRITICAL for ScrollViews inside the Navigator to work */}
        <View style={styles.container}>
          <AppNavigator />
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // This forces the app to occupy the full screen height
    backgroundColor: '#fff',
  },
});