import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, toDay } from './date';
import { deleteAllPhotos, deleteOrphans, deletePhotos } from './photos';

export const DB_NAME = 'mirror.db';
const DATABASE_VERSION = 2;

export type Entry = {
  id: number;
  date: string; // YYYY-MM-DD
  mood: number; // 1..5
  text: string;
  created_at: string; // ISO timestamp
  feelings: string[];
  activities: string[];
  prompt: string | null;
  images: string[]; // file names in the private photos folder
};

type EntryRow = Omit<Entry, 'feelings' | 'activities' | 'images'> & { feelings: string; activities: string; images: string };

export async function migrateDb(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
        text TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        feelings TEXT NOT NULL DEFAULT '[]',
        activities TEXT NOT NULL DEFAULT '[]',
        prompt TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }
  if (version < 2) {
    // v2: photo attachments (JSON array of file names inside the app's photos folder)
    await db.execAsync(`ALTER TABLE entries ADD COLUMN images TEXT NOT NULL DEFAULT '[]';`);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

const parseList = (s: string): string[] => {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const fromRow = (r: EntryRow): Entry => ({
  ...r,
  feelings: parseList(r.feelings),
  activities: parseList(r.activities),
  images: parseList(r.images),
});

export type EntryInput = Pick<Entry, 'date' | 'mood' | 'text' | 'feelings' | 'activities' | 'prompt' | 'images'>;

/** One entry per day: saving again on the same day updates it. */
export async function saveEntry(db: SQLiteDatabase, e: EntryInput): Promise<number> {
  await db.runAsync(
    `INSERT INTO entries (date, mood, text, created_at, feelings, activities, prompt, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood, text = excluded.text, feelings = excluded.feelings,
       activities = excluded.activities, prompt = excluded.prompt, images = excluded.images`,
    e.date, e.mood, e.text.trim(), new Date().toISOString(),
    JSON.stringify(e.feelings), JSON.stringify(e.activities), e.prompt, JSON.stringify(e.images),
  );
  const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM entries WHERE date = ?', e.date);
  return row?.id ?? 0;
}

export async function getEntry(db: SQLiteDatabase, id: number) {
  const r = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE id = ?', id);
  return r ? fromRow(r) : null;
}

export async function getEntryByDate(db: SQLiteDatabase, date: string) {
  const r = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE date = ?', date);
  return r ? fromRow(r) : null;
}

export async function listEntries(db: SQLiteDatabase, opts: { mood?: number; search?: string } = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.mood) {
    where.push('mood = ?');
    params.push(opts.mood);
  }
  if (opts.search?.trim()) {
    where.push('(text LIKE ? OR feelings LIKE ? OR activities LIKE ?)');
    const q = `%${opts.search.trim()}%`;
    params.push(q, q, q);
  }
  const sql = `SELECT * FROM entries ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date DESC`;
  const rows = await db.getAllAsync<EntryRow>(sql, params);
  return rows.map(fromRow);
}

export async function entriesSince(db: SQLiteDatabase, fromDay: string) {
  const rows = await db.getAllAsync<EntryRow>('SELECT * FROM entries WHERE date >= ? ORDER BY date ASC', fromDay);
  return rows.map(fromRow);
}

/** A random entry from at least a week ago; falls back to any earlier day. */
export async function randomLookBack(db: SQLiteDatabase, excludeId?: number) {
  const today = toDay();
  const pick = (before: string) =>
    db.getFirstAsync<EntryRow>(
      'SELECT * FROM entries WHERE date <= ? AND id != ? ORDER BY RANDOM() LIMIT 1',
      before, excludeId ?? -1,
    );
  const r = (await pick(addDays(today, -7))) ?? (await pick(addDays(today, -1)));
  return r ? fromRow(r) : null;
}

export async function deleteEntry(db: SQLiteDatabase, id: number) {
  const e = await getEntry(db, id);
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
  if (e) deletePhotos(e.images);
}

export async function countEntries(db: SQLiteDatabase) {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entries');
  return r?.n ?? 0;
}

/** Consecutive days with an entry, ending today (or yesterday if today is not written yet). */
export async function currentStreak(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ date: string }>('SELECT date FROM entries ORDER BY date DESC LIMIT 400');
  const days = new Set(rows.map((r) => r.date));
  let cursor = toDay();
  if (!days.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Runs once at startup, before any screen can add new photos. */
export async function sweepOrphanPhotos(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ images: string }>("SELECT images FROM entries WHERE images != '[]'");
  deleteOrphans(new Set(rows.flatMap((r) => parseList(r.images))));
}

export async function wipeAll(db: SQLiteDatabase) {
  await db.execAsync('DELETE FROM entries; DELETE FROM settings;');
  deleteAllPhotos();
}

// ---- settings (key/value) ----

export async function getAllSettings(db: SQLiteDatabase): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, value,
  );
}
