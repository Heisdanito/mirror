import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { photoUri } from '@/lib/photos';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MoodChart } from '@/components/MoodChart';
import { MoodDot } from '@/components/MoodPicker';
import { Body, Button, Card, Label, Screen, Title, tap } from '@/components/ui';
import { MOODS, moodInfo } from '@/lib/constants';
import { addDays, formatLong, greeting, relativeAgo, toDay } from '@/lib/date';
import { countEntries, currentStreak, entriesSince, getEntryByDate, randomLookBack, type Entry } from '@/lib/db';
import { fonts, useSettings } from '@/lib/settings';

export default function Today() {
  const db = useSQLiteContext();
  const { settings, palette: p } = useSettings();
  const [today, setToday] = useState<Entry | null>(null);
  const [week, setWeek] = useState<Entry[]>([]);
  const [lookBack, setLookBack] = useState<Entry | null>(null);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const day = toDay();
    const [t, w, l, s, n] = await Promise.all([
      getEntryByDate(db, day),
      entriesSince(db, addDays(day, -6)),
      randomLookBack(db),
      currentStreak(db),
      countEntries(db),
    ]);
    setToday(t);
    setWeek(w);
    setLookBack(l);
    setStreak(s);
    setTotal(n);
  }, [db]);

  useFocusEffect(useCallback(() => void load(), [load]));

  const shuffle = async () => {
    tap();
    setLookBack(await randomLookBack(db, lookBack?.id));
  };

  return (
    <Screen>
      <Label>{formatLong(toDay())}</Label>
      <Title style={{ marginTop: 6, marginBottom: 20 }}>
        {greeting()}
        {settings.name ? `, ${settings.name}` : ''}.
      </Title>

      {today ? (
        <Card onPress={() => router.push(`/entry/${today.id}`)} style={{ gap: 12 }}>
          <View style={styles.row}>
            <MoodDot mood={today.mood} size={44} />
            <View style={{ flex: 1 }}>
              <Label>Today</Label>
              <Text style={[styles.big, { color: p.ink }]}>Feeling {moodInfo(today.mood).label.toLowerCase()}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={p.faint} />
          </View>
          {!!today.text && <Body numberOfLines={2} style={{ color: p.muted }}>{today.text}</Body>}
        </Card>
      ) : (
        <Card style={{ gap: 16 }}>
          <Text style={[styles.big, { color: p.ink }]}>How are you today?</Text>
          <View style={styles.quickRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                accessibilityLabel={`Start an entry feeling ${m.label}`}
                onPress={() => {
                  tap();
                  router.push({ pathname: '/write', params: { mood: String(m.value) } });
                }}
                style={({ pressed }) => [styles.quick, pressed && { transform: [{ scale: 0.92 }] }]}
              >
                <MaterialCommunityIcons name={m.icon} size={38} color={m.color} />
                <Text style={[styles.quickLabel, { color: p.muted }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Write today's entry" onPress={() => router.push('/write')} />
        </Card>
      )}

      <View style={[styles.stats, { marginTop: 14 }]}>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, { color: p.ink }]}>{streak}</Text>
          <Label>Day streak</Label>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, { color: p.ink }]}>{total}</Text>
          <Label>Entries</Label>
        </Card>
      </View>

      <Card style={{ marginTop: 14, gap: 14 }} onPress={() => router.navigate('/insights')}>
        <View style={styles.rowBetween}>
          <Label>This week</Label>
          <Text style={{ color: p.accent, fontWeight: '600', fontSize: 13 }}>See insights</Text>
        </View>
        <MoodChart entries={week} days={7} height={90} />
      </Card>

      <Card style={{ marginTop: 14, gap: 12, backgroundColor: p.accentSoft, borderColor: 'transparent' }}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="history" size={18} color={p.accent} />
            <Label style={{ color: p.accent }}>Look back</Label>
          </View>
          {lookBack && (
            <Pressable onPress={shuffle} hitSlop={10} accessibilityLabel="Show another old entry">
              <MaterialCommunityIcons name="shuffle-variant" size={20} color={p.accent} />
            </Pressable>
          )}
        </View>
        {lookBack ? (
          <Pressable onPress={() => router.push(`/entry/${lookBack.id}`)} style={{ gap: 8 }}>
            {lookBack.images.length > 0 && (
              <Image source={{ uri: photoUri(lookBack.images[0]) }} style={styles.lookImg} accessibilityLabel="Photo from that day" />
            )}
            <Text style={[styles.quote, { color: p.ink }]} numberOfLines={4}>
              {lookBack.text ? `“${lookBack.text}”` : `You felt ${moodInfo(lookBack.mood).label.toLowerCase()} that day.`}
            </Text>
            <Text style={{ color: p.muted, fontSize: 13 }}>
              {relativeAgo(lookBack.date)} · felt {moodInfo(lookBack.mood).label.toLowerCase()}
            </Text>
          </Pressable>
        ) : (
          <Body style={{ color: p.muted }}>
            Keep writing. In a few days, your past entries will start showing up here.
          </Body>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  big: { fontFamily: fonts.serif, fontSize: 22 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quick: { alignItems: 'center', gap: 4, flex: 1 },
  quickLabel: { fontSize: 11, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 14 },
  stat: { flex: 1, gap: 2 },
  statNum: { fontFamily: fonts.serif, fontSize: 32 },
  quote: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26 },
  lookImg: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14 },
});
