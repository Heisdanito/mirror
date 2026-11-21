import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Body, Button, Card, ChipGroup, Label, Screen, Title, tap, toggleIn } from '@/components/ui';
import { ACCENTS, GOALS } from '@/lib/constants';
import { wipeAll } from '@/lib/db';
import { useSettings, type ThemeMode } from '@/lib/settings';

const THEMES: { key: ThemeMode; label: string; icon: 'theme-light-dark' | 'white-balance-sunny' | 'weather-night' }[] = [
  { key: 'system', label: 'Auto', icon: 'theme-light-dark' },
  { key: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { key: 'dark', label: 'Dark', icon: 'weather-night' },
];

export default function You() {
  const db = useSQLiteContext();
  const { settings, palette: p, update, reset } = useSettings();
  const [name, setName] = useState(settings.name);

  const confirmWipe = () =>
    Alert.alert('Delete everything?', 'All entries and settings on this phone will be erased. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await wipeAll(db);
          reset();
          router.replace('/onboarding');
        },
      },
    ]);

  return (
    <Screen>
      <Title style={{ marginBottom: 20 }}>You</Title>

      <Label style={styles.section}>Name</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        onEndEditing={() => update({ name: name.trim() })}
        placeholder="Your first name"
        placeholderTextColor={p.faint}
        maxLength={40}
        style={[styles.input, { color: p.ink, borderColor: p.border, backgroundColor: p.surface }]}
      />

      <Label style={styles.section}>Appearance</Label>
      <View style={styles.row}>
        {THEMES.map((t) => {
          const active = settings.theme === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => { tap(); update({ theme: t.key }); }}
              style={[styles.themeItem, { borderColor: active ? p.accent : p.border, backgroundColor: active ? p.accentSoft : p.surface }]}
            >
              <MaterialCommunityIcons name={t.icon} size={22} color={active ? p.accent : p.muted} />
              <Text style={{ color: p.ink, fontWeight: '600', fontSize: 13 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Label style={styles.section}>Colour</Label>
      <View style={styles.row}>
        {ACCENTS.map((a) => (
          <Pressable
            key={a.key}
            accessibilityLabel={a.label}
            accessibilityState={{ selected: settings.accent === a.key }}
            onPress={() => { tap(); update({ accent: a.key }); }}
            style={[styles.swatch, { backgroundColor: a.color, borderColor: settings.accent === a.key ? p.ink : 'transparent' }]}
          >
            {settings.accent === a.key && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
          </Pressable>
        ))}
      </View>

      <Label style={styles.section}>Your goals</Label>
      <ChipGroup options={GOALS} selected={settings.goals} onToggle={(g) => update({ goals: toggleIn(settings.goals, g) })} />

      <Card style={{ marginTop: 28, gap: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
        <MaterialCommunityIcons name="shield-lock-outline" size={22} color={p.accent} />
        <Body style={{ flex: 1, color: p.muted, fontSize: 14, lineHeight: 20 }}>
          Your journal lives only on this phone. Mirror has no account, no cloud and no ads.
        </Body>
      </Card>

      <Button title="Replay introduction" variant="ghost" style={{ marginTop: 20 }} onPress={() => router.push('/onboarding')} />
      <Button title="Delete all data" variant="danger" style={{ marginTop: 10 }} onPress={confirmWipe} />

      <Text style={[styles.about, { color: p.faint }]}>
        Mirror {Constants.expoConfig?.version ?? ''} · Built by Daniel under HeisDev
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  themeItem: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  about: { textAlign: 'center', marginTop: 28, fontSize: 12 },
});
