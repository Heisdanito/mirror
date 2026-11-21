import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EntryCard } from '@/components/EntryCard';
import { Body, Button, Chip, Label, Title } from '@/components/ui';
import { MOODS } from '@/lib/constants';
import { monthLabel } from '@/lib/date';
import { listEntries, type Entry } from '@/lib/db';
import { usePalette } from '@/lib/settings';

export default function Journal() {
  const db = useSQLiteContext();
  const p = usePalette();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setEntries(await listEntries(db, { mood, search }));
    setLoaded(true);
  }, [db, mood, search]);

  useFocusEffect(useCallback(() => void load(), [load]));

  const sections = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = monthLabel(e.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map].map(([title, data]) => ({ title, data }));
  }, [entries]);

  const filtered = !!mood || !!search.trim();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.pad}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 8 }}>
            <Title>Journal</Title>
            <View style={[styles.search, { backgroundColor: p.surface, borderColor: p.border }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={p.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search words, feelings, activities"
                placeholderTextColor={p.faint}
                style={{ flex: 1, color: p.ink, fontSize: 15, paddingVertical: 10 }}
                returnKeyType="search"
              />
            </View>
            <View style={styles.filters}>
              <Chip label="All" selected={!mood} onPress={() => setMood(undefined)} />
              {MOODS.map((m) => (
                <Chip key={m.value} label={m.label} color={m.color} selected={mood === m.value} onPress={() => setMood(mood === m.value ? undefined : m.value)} />
              ))}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => <Label style={{ marginTop: 18, marginBottom: 10 }}>{section.title}</Label>}
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name={filtered ? 'text-search' : 'feather'} size={40} color={p.faint} />
              <Body style={{ color: p.muted, textAlign: 'center' }}>
                {filtered ? 'Nothing matches that filter.' : 'Your journal is empty. Your first entry is one tap away.'}
              </Body>
              {!filtered && <Button title="Write your first entry" onPress={() => router.push('/write')} style={{ alignSelf: 'stretch' }} />}
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { alignItems: 'center', gap: 14, paddingTop: 48 },
});
