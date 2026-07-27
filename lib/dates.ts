/** Local (not UTC) YYYY-MM-DD, so "today" matches the user's calendar day. */
export function dayKey(ts: number | Date = Date.now()): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(Date.now());
}

export function hourOf(ts: number): number {
  return new Date(ts).getHours();
}

/** 0 = Sunday .. 6 = Saturday */
export function weekdayOf(ts: number): number {
  return new Date(ts).getDay();
}

export function daysAgo(n: number): number {
  return Date.now() - n * 86400000;
}

export function formatClockRange(hour: number, lang: 'ar' | 'en'): string {
  const end = (hour + 1) % 24;
  const pad = (h: number) => h.toString().padStart(2, '0');
  return lang === 'ar' ? `${pad(hour)}:00 - ${pad(end)}:00` : `${pad(hour)}:00–${pad(end)}:00`;
}

export const WEEKDAY_NAMES = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
