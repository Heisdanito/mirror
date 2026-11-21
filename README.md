# Mirror

**See yourself clearly.** A private, offline journaling app that helps you notice your own patterns over time.
Built by Daniel under HeisDev.

## Features (v1)
- **Onboarding** – short intro, privacy note, name, goals, and accent colour.
- **Daily entry** – a 1–5 mood (Heavy, Low, Okay, Good, Bright), feeling and activity tags, optional writing prompts.
- **Journal** – entries grouped by month, with search and mood filters.
- **Insights** – week / month / 3-month mood chart, average mood, mood distribution, and what your good and hard days have in common.
- **Look back** – a random older entry on the home screen.
- **You** – light, dark or auto theme, five accent colours, goals, and a delete-all option.

Everything is stored on the device with SQLite. No account, cloud, or ads.

## Tech
React Native · Expo SDK 58 · Expo Router · expo-sqlite · TypeScript

## Run it
```bash
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your phone.

## Checks
```bash
npm run typecheck
npx eslint .
npx expo-doctor
```

## Project layout
```
src/app/            screens (Expo Router)
  (tabs)/           Today, Journal, Insights, You
  onboarding.tsx    first-run intro
  write.tsx         new / edit entry (modal)
  entry/[id].tsx    entry detail
src/components/     UI building blocks, mood picker, chart
src/lib/            database, settings/theme, dates, constants
private/            git-ignored, for local secrets and data
```

## Database
`entries(id, date UNIQUE, mood 1–5, text, created_at, feelings JSON, activities JSON, prompt)`
`settings(key, value)`, which stores onboarding, name, theme, accent, and goals.

## Roadmap (v2)
Voice entries · AI insights · cloud backup and accounts (Supabase) · premium via Paystack · reminders.
