import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MoodPicker } from '@/components/MoodPicker';
import { PhotoPicker } from '@/components/Photos';
import { deletePhotos } from '@/lib/photos';
import { Button, Card, ChipGroup, Label, Screen, tap, toggleIn } from '@/components/ui';
import { ACTIVITIES, FEELINGS, PROMPTS, type MoodValue } from '@/lib/constants';
import { formatLong, toDay } from '@/lib/date';
import { getEntryByDate, saveEntry } from '@/lib/db';
import { fonts, usePalette } from '@/lib/settings';

const MAX = 2000;

export default function Write() {
  const db = useSQLiteContext();
  const p = usePalette();
  const params = useLocalSearchParams<{ mood?: string; date?: string }>();
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : toDay();
  const initialMood = Number(params.mood);

  const [mood, setMood] = useState<MoodValue | null>(initialMood >= 1 && initialMood <= 5 ? (initialMood as MoodValue) : null);
  const [text, setText] = useState('');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [usePrompt, setUsePrompt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEntryByDate(db, date).then((e) => {
      if (!e) return;
      setEditing(true);
      setMood((m) => m ?? (e.mood as MoodValue));
      setText(e.text);
      setFeelings(e.feelings);
      setActivities(e.activities);
      setImages(e.images);
      setSavedImages(e.images);
      const i = e.prompt ? PROMPTS.indexOf(e.prompt) : -1;
      if (i >= 0) {
        setPromptIdx(i);
        setUsePrompt(true);
      }
    });
  }, [db, date]);

  const prompt = PROMPTS[promptIdx];
  const mark = <T,>(fn: (v: T) => void) => (v: T) => {
    setDirty(true);
    fn(v);
  };

  const close = () => {
    if (!dirty) return router.back();
    Alert.alert('Discard this entry?', 'What you wrote will not be saved.', [
      { text: 'Keep writing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          deletePhotos(images.filter((n) => !savedImages.includes(n))); // photos added this session
          router.back();
        },
      },
    ]);
  };

  const save = async () => {
    if (!mood || saving) return;
    setSaving(true);
    await saveEntry(db, { date, mood, text: text.slice(0, MAX), feelings, activities, prompt: usePrompt ? prompt : null, images });
    deletePhotos(savedImages.filter((n) => !images.includes(n))); // photos removed while editing
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  const placeholder = useMemo(() => (usePrompt ? prompt : 'Write whatever is on your mind…'), [usePrompt, prompt]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: p.bg }}>
      <Screen edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={26} color={p.ink} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: p.ink }]}>{editing ? 'Edit entry' : 'New entry'}</Text>
          <View style={{ width: 26 }} />
        </View>
        <Label style={{ textAlign: 'center', marginBottom: 20 }}>{formatLong(date)}</Label>

        <Label style={styles.section}>Your mood</Label>
        <MoodPicker value={mood} onChange={mark(setMood)} />

        <Label style={styles.section}>What did you feel?</Label>
        <ChipGroup options={FEELINGS} selected={feelings} onToggle={mark((v: string) => setFeelings((f) => toggleIn(f, v)))} />

        <Label style={styles.section}>What were you up to?</Label>
        <ChipGroup options={ACTIVITIES} selected={activities} onToggle={mark((v: string) => setActivities((a) => toggleIn(a, v)))} />

        <Label style={styles.section}>Write</Label>
        <Card style={[styles.promptCard, { backgroundColor: usePrompt ? p.accentSoft : p.surfaceAlt, borderColor: 'transparent' }]}>
          <Pressable style={{ flex: 1 }} onPress={() => { tap(); setUsePrompt(!usePrompt); }} accessibilityRole="checkbox" accessibilityState={{ checked: usePrompt }}>
            <Text style={{ color: p.muted, fontSize: 12, fontWeight: '600' }}>{usePrompt ? 'USING PROMPT' : 'NEED A PROMPT? TAP TO USE'}</Text>
            <Text style={[styles.prompt, { color: p.ink }]}>{prompt}</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            accessibilityLabel="Another prompt"
            onPress={() => {
              tap();
              setPromptIdx((i) => (i + 1 + Math.floor(Math.random() * (PROMPTS.length - 1))) % PROMPTS.length);
            }}
          >
            <MaterialCommunityIcons name="refresh" size={22} color={p.accent} />
          </Pressable>
        </Card>
        <TextInput
          value={text}
          onChangeText={mark(setText)}
          placeholder={placeholder}
          placeholderTextColor={p.faint}
          multiline
          maxLength={MAX}
          textAlignVertical="top"
          style={[styles.input, { color: p.ink, backgroundColor: p.surface, borderColor: p.border }]}
        />
        <Text style={{ color: p.faint, fontSize: 12, textAlign: 'right', marginTop: 6 }}>
          {text.length}/{MAX}
        </Text>

        <Label style={styles.section}>Photos</Label>
        <PhotoPicker value={images} onChange={mark(setImages)} />

        <Button
          title={mood ? (editing ? 'Save changes' : 'Save entry') : 'Pick a mood to save'}
          onPress={save}
          disabled={!mood || saving}
          style={{ marginTop: 20 }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 20 },
  section: { marginTop: 26, marginBottom: 12 },
  promptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  prompt: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, marginTop: 4 },
  input: { minHeight: 160, borderWidth: 1, borderRadius: 18, padding: 16, fontSize: 17, lineHeight: 25 },
});
