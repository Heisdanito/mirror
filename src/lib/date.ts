const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export function toDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

export function formatLong(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShort(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function weekdayLetter(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
}

export function monthLabel(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function relativeAgo(day: string, today = toDay()): string {
  const n = daysBetween(day, today);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return `${n} days ago`;
  if (n < 30) return `${Math.floor(n / 7)} week${n < 14 ? '' : 's'} ago`;
  if (n < 365) return `${Math.floor(n / 30)} month${n < 60 ? '' : 's'} ago`;
  return `${Math.floor(n / 365)} year${n < 730 ? '' : 's'} ago`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
