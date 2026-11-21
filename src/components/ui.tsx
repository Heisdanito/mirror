import type { ReactNode } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
  type PressableProps, type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fonts, usePalette } from '@/lib/settings';

export const tap = () => Haptics.selectionAsync().catch(() => {});

export function Screen({
  children, scroll = true, edges = ['top'], contentStyle,
}: { children: ReactNode; scroll?: boolean; edges?: Edge[]; contentStyle?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: p.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.screenPad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, styles.screenPad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return <Text style={[styles.title, { color: p.ink }, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return <Text style={[styles.label, { color: p.muted }, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const p = usePalette();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: p.ink }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const p = usePalette();
  const base = [styles.card, { backgroundColor: p.surface, borderColor: p.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const p = usePalette();
  const c = color ?? p.accent;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? c : p.border, backgroundColor: selected ? c : p.surface },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? p.onAccent : p.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({
  options, selected, onToggle, color,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; color?: string }) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={selected.includes(o)} onPress={() => onToggle(o)} color={color} />
      ))}
    </View>
  );
}

export function Button({
  title, onPress, variant = 'primary', disabled, style, ...rest
}: { title: string; variant?: 'primary' | 'ghost' | 'danger'; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style'>) {
  const p = usePalette();
  const bg = variant === 'primary' ? p.accent : 'transparent';
  const fg = variant === 'primary' ? p.onAccent : variant === 'danger' ? p.danger : p.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'primary' ? bg : p.border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const styles = StyleSheet.create({
  screenPad: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' },
  body: { fontSize: 16, lineHeight: 24 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderRadius: 16, borderWidth: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
