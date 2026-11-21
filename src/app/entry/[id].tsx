import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MoodDot } from '@/components/MoodPicker';
import { PhotoGallery } from '@/components/Photos';
import { Body, Card, Label, Screen } from '@/components/ui';
import { moodInfo } from '@/lib/constants';
import { formatLong, relativeAgo } from '@/lib/date';
import { deleteEntry, getEntry, type Entry } from '@/lib/db';
import { fonts, usePalette } from '@/lib/settings';

export default function EntryView() {
  const db = useSQLiteContext();
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      getEntry(db, Number(id)).then(setEntry);
    }, [db, id]),
  );

  const remove = () =>
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (entry) await deleteEntry(db, entry.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={p.ink} />
        </Pressable>
        {entry && (
          <View style={{ flexDirection: 'row', gap: 22 }}>
            <Pressable
              hitSlop={12}
              accessibilityLabel="Edit entry"
              onPress={() => router.push({ pathname: '/write', params: { date: entry.date } })}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={p.ink} />
            </Pressable>
            <Pressable hitSlop={12} accessibilityLabel="Delete entry" onPress={remove}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={p.danger} />
            </Pressable>
          </View>
        )}
      </View>

      {entry === null && <Body style={{ color: p.muted, marginTop: 40, textAlign: 'center' }}>This entry no longer exists.</Body>}

      {entry && (
        <View style={{ gap: 18, marginTop: 16 }}>
          <View style={styles.row}>
            <MoodDot mood={entry.mood} size={52} />
            <View>
              <Text style={[styles.date, { color: p.ink }]}>{formatLong(entry.date)}</Text>
              <Text style={{ color: p.muted, marginTop: 2 }}>
                {relativeAgo(entry.date)} · felt {moodInfo(entry.mood).label.toLowerCase()}
              </Text>
            </View>
          </View>

          {entry.prompt && (
            <Card style={{ backgroundColor: p.accentSoft, borderColor: 'transparent', padding: 14 }}>
              <Text style={{ color: p.muted, fontSize: 12, fontWeight: '600' }}>PROMPT</Text>
              <Text style={[styles.prompt, { color: p.ink }]}>{entry.prompt}</Text>
            </Card>
          )}

          <Text style={[styles.text, { color: entry.text ? p.ink : p.faint }]}>{entry.text || 'No words, just a feeling.'}</Text>

          <PhotoGallery names={entry.images} />

          {entry.feelings.length > 0 && <TagRow title="Felt" items={entry.feelings} />}
          {entry.activities.length > 0 && <TagRow title="Did" items={entry.activities} />}
        </View>
      )}
    </Screen>
  );
}

function TagRow({ title, items }: { title: string; items: string[] }) {
  const p = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Label>{title}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((t) => (
          <View key={t} style={[styles.tag, { backgroundColor: p.surfaceAlt }]}>
            <Text style={{ color: p.ink, fontSize: 13 }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  date: { fontFamily: fonts.serif, fontSize: 22 },
  prompt: { fontFamily: fonts.serif, fontSize: 16, marginTop: 4 },
  text: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 30 },
  tag: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
