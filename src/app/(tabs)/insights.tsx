import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MoodChart } from '@/components/MoodChart';
import { Body, Card, Label, Screen, Title, tap } from '@/components/ui';
import { MOODS, moodInfo } from '@/lib/constants';
import { addDays, toDay } from '@/lib/date';
import { entriesSince, type Entry } from '@/lib/db';
import { fonts, usePalette } from '@/lib/settings';

const RANGES = [
  { days: 7, label: 'Week' },
  { days: 30, label: 'Month' },
  { days: 90, label: '3 months' },
] as const;

function topTags(entries: Entry[], key: 'feelings' | 'activities', n = 3) {
  const counts = new Map<string, number>();
  for (const e of entries) for (const t of e[key]) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}

export default function Insights() {
  const db = useSQLiteContext();
  const p = usePalette();
  const [range, setRange] = useState<number>(7);
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => {
      entriesSince(db, addDays(toDay(), -range + 1)).then(setEntries);
    }, [db, range]),
  );

  const stats = useMemo(() => {
    const n = entries.length;
    const avg = n ? entries.reduce((s, e) => s + e.mood, 0) / n : 0;
    const dist = MOODS.map((m) => entries.filter((e) => e.mood === m.value).length);
    const good = entries.filter((e) => e.mood >= 4);
    const hard = entries.filter((e) => e.mood <= 2);
    return {
      n, avg, dist,
      goodActs: topTags(good, 'activities'),
      hardActs: topTags(hard, 'activities'),
      feelings: topTags(entries, 'feelings', 5),
    };
  }, [entries]);

  const max = Math.max(1, ...stats.dist);
  const rangeLabel = RANGES.find((r) => r.days === range)?.label.toLowerCase();

  return (
    <Screen>
      <Title style={{ marginBottom: 16 }}>Insights</Title>

      <View style={[styles.segment, { backgroundColor: p.surfaceAlt }]}>
        {RANGES.map((r) => {
          const active = r.days === range;
          return (
            <Pressable
              key={r.days}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => { tap(); setRange(r.days); }}
              style={[styles.segItem, active && { backgroundColor: p.surface }]}
            >
              <Text style={{ color: active ? p.ink : p.muted, fontWeight: '600' }}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: 16, gap: 14 }}>
        <Label>Mood over the {rangeLabel}</Label>
        <MoodChart entries={entries} days={range} />
      </Card>

      <View style={styles.statRow}>
        <Card style={styles.stat}>
          <Text style={[styles.num, { color: stats.n ? moodInfo(Math.round(stats.avg)).color : p.faint }]}>
            {stats.n ? stats.avg.toFixed(1) : '–'}
          </Text>
          <Label>Average mood</Label>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.num, { color: p.ink }]}>
            {stats.n}
            <Text style={{ fontSize: 18, color: p.muted }}>/{range}</Text>
          </Text>
          <Label>Days written</Label>
        </Card>
      </View>

      {stats.n === 0 ? (
        <Card style={{ marginTop: 14 }}>
          <Body style={{ color: p.muted }}>
            No entries in this {rangeLabel} yet. Patterns appear after a handful of days, so keep going.
          </Body>
        </Card>
      ) : (
        <>
          <Card style={{ marginTop: 14, gap: 12 }}>
            <Label>How your days felt</Label>
            {MOODS.map((m, i) => (
              <View key={m.value} style={styles.distRow}>
                <Text style={[styles.distLabel, { color: p.ink }]}>{m.label}</Text>
                <View style={[styles.track, { backgroundColor: p.surfaceAlt }]}>
                  <View style={{ width: `${(stats.dist[i] / max) * 100}%`, backgroundColor: m.color, height: '100%', borderRadius: 6 }} />
                </View>
                <Text style={[styles.distNum, { color: p.muted }]}>{stats.dist[i]}</Text>
              </View>
            ))}
          </Card>

          <Card style={{ marginTop: 14, gap: 14 }}>
            <Label>Patterns</Label>
            <Pattern title="On your good days" items={stats.goodActs} empty="Rate a day Good or Bright to see what lifts you." color={MOODS[4].color} />
            <Pattern title="On your harder days" items={stats.hardActs} empty="No harder days tagged in this range." color={MOODS[0].color} />
            <Pattern title="Feelings that keep showing up" items={stats.feelings} empty="Tag feelings in your entries to see them here." color={p.accent} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function Pattern({ title, items, empty, color }: { title: string; items: string[]; empty: string; color: string }) {
  const p = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: p.ink, fontWeight: '600', fontSize: 15 }}>{title}</Text>
      {items.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {items.map((t) => (
            <View key={t} style={[styles.tag, { borderColor: color }]}>
              <Text style={{ color: p.ink, fontSize: 13 }}>{t}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: p.muted, fontSize: 14 }}>{empty}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  statRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
  stat: { flex: 1, gap: 2 },
  num: { fontFamily: fonts.serif, fontSize: 34 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distLabel: { width: 56, fontSize: 14 },
  track: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  distNum: { width: 24, textAlign: 'right', fontSize: 13 },
  tag: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
