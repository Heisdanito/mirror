import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DB_NAME, migrateDb, sweepOrphanPhotos } from '@/lib/db';
import { SettingsProvider, usePalette } from '@/lib/settings';

async function initDb(db: SQLiteDatabase) {
  await migrateDb(db);
  await sweepOrphanPhotos(db).catch(() => {});
}

function ThemedStack() {
  const p = usePalette();
  return (
    <>
      <StatusBar style={p.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: p.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="write" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="entry/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
        <SettingsProvider>
          <ThemedStack />
        </SettingsProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
