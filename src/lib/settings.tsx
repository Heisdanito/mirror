import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { ACCENTS, type AccentKey } from './constants';
import { getAllSettings, setSetting } from './db';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  onboarded: boolean;
  name: string;
  accent: AccentKey;
  theme: ThemeMode;
  goals: string[];
};

const DEFAULTS: Settings = { onboarded: false, name: '', accent: 'clay', theme: 'system', goals: [] };

export type Palette = {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
};

const light = {
  dark: false, bg: '#F6F1EA', surface: '#FFFDF9', surfaceAlt: '#EFE8DE', border: '#E4DACC',
  ink: '#2A2320', muted: '#7C7168', faint: '#B3A89C', onAccent: '#FFFFFF', danger: '#B4443A',
};
const dark = {
  dark: true, bg: '#171412', surface: '#221E1B', surfaceAlt: '#2C2724', border: '#3A3430',
  ink: '#F1EAE2', muted: '#A99E94', faint: '#6E655E', onAccent: '#FFFFFF', danger: '#E0786E',
};

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
};

type Ctx = {
  settings: Settings;
  palette: Palette;
  update: (patch: Partial<Settings>) => Promise<void>;
  reset: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const system = useColorScheme();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getAllSettings(db).then((raw) => {
      let goals: string[] = [];
      try {
        goals = raw.goals ? JSON.parse(raw.goals) : [];
      } catch {}
      setSettings({
        onboarded: raw.onboarded === '1',
        name: raw.name ?? '',
        accent: (ACCENTS.some((a) => a.key === raw.accent) ? raw.accent : 'clay') as AccentKey,
        theme: (['system', 'light', 'dark'].includes(raw.theme) ? raw.theme : 'system') as ThemeMode,
        goals,
      });
    });
  }, [db]);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      setSettings((s) => ({ ...(s ?? DEFAULTS), ...patch }));
      for (const [k, v] of Object.entries(patch)) {
        const value = typeof v === 'boolean' ? (v ? '1' : '0') : Array.isArray(v) ? JSON.stringify(v) : String(v);
        await setSetting(db, k, value);
      }
    },
    [db],
  );

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  const palette = useMemo<Palette>(() => {
    const s = settings ?? DEFAULTS;
    const isDark = s.theme === 'dark' || (s.theme === 'system' && system === 'dark');
    const base = isDark ? dark : light;
    const accent = ACCENTS.find((a) => a.key === s.accent)?.color ?? ACCENTS[0].color;
    return { ...base, accent, accentSoft: hexToRgba(accent, isDark ? 0.22 : 0.12) };
  }, [settings, system]);

  if (!settings) return null; // settings load in a few ms; splash covers it

  return (
    <SettingsContext.Provider value={{ settings, palette, update, reset }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export const usePalette = () => useSettings().palette;
