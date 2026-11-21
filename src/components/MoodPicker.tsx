import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MOODS, type MoodValue } from '@/lib/constants';
import { usePalette } from '@/lib/settings';
import { tap } from './ui';

export function MoodPicker({ value, onChange }: { value: MoodValue | null; onChange: (m: MoodValue) => void }) {
  const p = usePalette();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <Pressable
            key={m.value}
            accessibilityRole="radio"
            accessibilityLabel={`Mood ${m.value}, ${m.label}`}
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(m.value);
            }}
            style={({ pressed }) => [
              styles.item,
              { backgroundColor: active ? m.color : p.surface, borderColor: active ? m.color : p.border },
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <MaterialCommunityIcons name={m.icon} size={30} color={active ? '#fff' : m.color} />
            <Text style={[styles.text, { color: active ? '#fff' : p.muted }]}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MoodDot({ mood, size = 36 }: { mood: number; size?: number }) {
  const m = MOODS[mood - 1];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={m.icon} size={size * 0.62} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1, gap: 4 },
  text: { fontSize: 12, fontWeight: '600' },
});
