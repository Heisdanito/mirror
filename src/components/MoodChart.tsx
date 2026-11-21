import { StyleSheet, Text, View } from 'react-native';
import { moodInfo } from '@/lib/constants';
import { addDays, toDay, weekdayLetter } from '@/lib/date';
import type { Entry } from '@/lib/db';
import { usePalette } from '@/lib/settings';

/** Bar per day for the last `days` days. Empty days show a small dot. */
export function MoodChart({ entries, days, height = 140 }: { entries: Entry[]; days: number; height?: number }) {
  const p = usePalette();
  const byDay = new Map(entries.map((e) => [e.date, e.mood]));
  const today = toDay();
  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    return { day, mood: byDay.get(day) ?? null };
  });
  const showLabels = days <= 7;
  const gap = days <= 7 ? 10 : 3;

  return (
    <View accessible accessibilityLabel={`Mood chart for the last ${days} days`}>
      <View style={[styles.plot, { height, gap }]}>
        {[1, 2, 3, 4, 5].map((g) => (
          <View
            key={g}
            pointerEvents="none"
            style={[styles.grid, { bottom: ((g - 1) / 4) * (height - 8) + 4, borderColor: p.border }]}
          />
        ))}
        {series.map(({ day, mood }) => (
          <View key={day} style={styles.col}>
            {mood ? (
              <View
                style={{
                  height: Math.max(8, (mood / 5) * height),
                  backgroundColor: moodInfo(mood).color,
                  borderRadius: days <= 7 ? 10 : 3,
                }}
              />
            ) : (
              <View style={[styles.empty, { backgroundColor: p.faint }]} />
            )}
          </View>
        ))}
      </View>
      {showLabels && (
        <View style={[styles.labels, { gap }]}>
          {series.map(({ day }) => (
            <Text key={day} style={[styles.label, { color: day === today ? p.ink : p.muted, fontWeight: day === today ? '700' : '500' }]}>
              {weekdayLetter(day)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  grid: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  col: { flex: 1, justifyContent: 'flex-end', alignItems: 'stretch' },
  empty: { height: 4, width: 4, borderRadius: 2, alignSelf: 'center', opacity: 0.6 },
  labels: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1, textAlign: 'center', fontSize: 12 },
});
