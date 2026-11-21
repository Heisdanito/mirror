import { Redirect, Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '@/lib/settings';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <MaterialCommunityIcons name={name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  const { settings, palette: p } = useSettings();
  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('white-balance-sunny') }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: icon('book-open-variant') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('chart-timeline-variant') }} />
      <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: icon('account-circle-outline') }} />
    </Tabs>
  );
}
