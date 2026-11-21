import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Body, Button, ChipGroup, Label, Screen, Title, tap, toggleIn } from '@/components/ui';
import { ACCENTS, GOALS, MOODS, type AccentKey } from '@/lib/constants';
import { fonts, useSettings } from '@/lib/settings';

const STEPS = 5;

export default function Onboarding() {
  const { settings, palette: p, update } = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [goals, setGoals] = useState<string[]>(settings.goals);
  const [accent, setAccent] = useState<AccentKey>(settings.accent);

  const next = async () => {
    if (step < STEPS - 1) return setStep(step + 1);
    await update({ name: name.trim(), goals, accent, onboarded: true });
    router.replace('/');
  };

  return (
    <Screen edges={['top', 'bottom']} scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.top}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} accessibilityLabel="Back">
              <MaterialCommunityIcons name="arrow-left" size={24} color={p.ink} />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <View style={styles.dots}>
            {Array.from({ length: STEPS }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i <= step ? p.accent : p.border, width: i === step ? 22 : 8 }]} />
            ))}
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          {step === 0 && (
            <View style={styles.center}>
              <View style={[styles.mirror, { borderColor: p.accent, backgroundColor: p.accentSoft }]}>
                <MaterialCommunityIcons name="mirror-variant" size={56} color={p.accent} />
              </View>
              <Text style={[styles.brand, { color: p.ink }]}>Mirror</Text>
              <Body style={{ color: p.muted, textAlign: 'center', fontSize: 18 }}>See yourself clearly.</Body>
              <Body style={{ color: p.muted, textAlign: 'center', marginTop: 24 }}>
                A few lines a day. Over weeks and months, you start to notice your own patterns.
              </Body>
            </View>
          )}

          {step === 1 && (
            <View style={{ gap: 22 }}>
              <Title>How it works</Title>
              {[
                { icon: 'pencil-outline', h: 'Write a little', t: 'One short entry a day. A sentence is enough.' },
                { icon: 'emoticon-outline', h: 'Rate your mood', t: 'Pick from five moods, and tag what you felt and did.' },
                { icon: 'chart-bar', h: 'See the trend', t: 'Your week and month at a glance, and what your good days have in common.' },
                { icon: 'history', h: 'Look back', t: 'Old entries resurface on your home screen so you can see how far you have come.' },
              ].map((r) => (
                <View key={r.h} style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: p.accentSoft }]}>
                    <MaterialCommunityIcons name={r.icon as 'history'} size={22} color={p.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureH, { color: p.ink }]}>{r.h}</Text>
                    <Body style={{ color: p.muted, fontSize: 15, lineHeight: 21 }}>{r.t}</Body>
                  </View>
                </View>
              ))}
              <View style={styles.moodPreview}>
                {MOODS.map((m) => (
                  <MaterialCommunityIcons key={m.value} name={m.icon} size={30} color={m.color} />
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 16 }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={44} color={p.accent} />
              <Title>Private by design</Title>
              <Body style={{ color: p.muted }}>
                Everything you write stays on this phone. No account, no cloud, no ads. Nobody reads your journal but you.
              </Body>
              <Body style={{ color: p.muted }}>
                If you delete the app, your entries go with it, so keep that in mind.
              </Body>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 16 }}>
              <Title>What should we call you?</Title>
              <Body style={{ color: p.muted }}>Just for greetings. You can skip this.</Body>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={p.faint}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
                maxLength={40}
                style={[styles.input, { color: p.ink, borderColor: p.border, backgroundColor: p.surface }]}
              />
            </View>
          )}

          {step === 4 && (
            <View style={{ gap: 18 }}>
              <Title>What brings you here?</Title>
              <Label>Pick any that fit</Label>
              <ChipGroup options={GOALS} selected={goals} onToggle={(g) => setGoals(toggleIn(goals, g))} />
              <Label style={{ marginTop: 12 }}>Choose a colour</Label>
              <View style={styles.swatches}>
                {ACCENTS.map((a) => (
                  <Pressable
                    key={a.key}
                    accessibilityLabel={a.label}
                    accessibilityState={{ selected: accent === a.key }}
                    onPress={() => {
                      tap();
                      setAccent(a.key);
                      update({ accent: a.key });
                    }}
                    style={[styles.swatch, { backgroundColor: a.color, borderColor: accent === a.key ? p.ink : 'transparent' }]}
                  >
                    {accent === a.key && <MaterialCommunityIcons name="check" size={20} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Button title={step === 0 ? 'Get started' : step === STEPS - 1 ? 'Start journaling' : 'Continue'} onPress={next} />
          {step === 3 && <Button title="Skip" variant="ghost" style={{ borderWidth: 0 }} onPress={() => { setName(''); setStep(4); }} />}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  body: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  center: { alignItems: 'center', gap: 8 },
  mirror: { width: 120, height: 150, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  brand: { fontFamily: fonts.serif, fontSize: 44, letterSpacing: -0.5 },
  feature: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureH: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  moodPreview: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18 },
  swatches: { flexDirection: 'row', gap: 14 },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
