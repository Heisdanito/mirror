import { Image, StyleSheet, Text, View } from 'react-native';
import { photoUri } from '@/lib/photos';
import { router } from 'expo-router';
import { moodInfo } from '@/lib/constants';
import { formatLong } from '@/lib/date';
import type { Entry } from '@/lib/db';
import { usePalette } from '@/lib/settings';
import { MoodDot } from './MoodPicker';
import { Body, Card } from './ui';

export function EntryCard({ entry }: { entry: Entry }) {
  const p = usePalette();
  const tags = [...entry.feelings, ...entry.activities];
  return (
    <Card onPress={() => router.push(`/entry/${entry.id}`)} style={styles.card}>
      <View style={styles.head}>
        <MoodDot mood={entry.mood} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.date, { color: p.ink }]}>{formatLong(entry.date)}</Text>
          <Text style={[styles.mood, { color: p.muted }]}>{moodInfo(entry.mood).label}</Text>
        </View>
        {entry.images.length > 0 && (
          <View>
            <Image source={{ uri: photoUri(entry.images[0]) }} style={[styles.thumb, { backgroundColor: p.surfaceAlt }]} />
            {entry.images.length > 1 && (
              <View style={[styles.more, { backgroundColor: p.ink }]}>
                <Text style={{ color: p.bg, fontSize: 10, fontWeight: '700' }}>+{entry.images.length - 1}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      {entry.text ? (
        <Body numberOfLines={3} style={{ color: p.ink }}>
          {entry.text}
        </Body>
      ) : (
        <Body style={{ color: p.faint, fontStyle: 'italic' }}>No words, just a feeling.</Body>
      )}
      {tags.length > 0 && (
        <Text numberOfLines={1} style={[styles.tags, { color: p.muted }]}>
          {tags.join('  ·  ')}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { fontSize: 15, fontWeight: '600' },
  mood: { fontSize: 13, marginTop: 1 },
  tags: { fontSize: 13 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  more: { position: 'absolute', bottom: -4, right: -4, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
});
