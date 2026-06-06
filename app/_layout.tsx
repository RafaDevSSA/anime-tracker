import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { runMigrations } from '@/src/db/schema';
import { NotificationService } from '@/src/services/NotificationService';
import { BackgroundTaskService } from '@/src/services/BackgroundTaskService';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      NotificationService.requestPermissions().then((granted) => {
        if (granted) BackgroundTaskService.register();
      });
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="animetracker.db" onInit={runMigrations}>
      <ThemeProvider>
        <RouterThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="anime/[id]" options={{ title: 'Detalhes', headerBackTitle: 'Voltar' }} />
          </Stack>
        </RouterThemeProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
