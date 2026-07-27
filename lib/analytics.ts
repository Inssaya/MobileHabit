import { dayKey, hourOf, weekdayOf, WEEKDAY_NAMES, formatClockRange } from './dates';
import { triggerLabel } from './triggers';
import type { CheckIn, Mood, TriggerKey, UrgeRecord } from './types';
import type { Lang } from './i18n';

export interface UrgeInsights {
  total: number;
  resisted: number;
  relapsed: number;
  resistRate: number;
  /** Hour of day (0-23) with the most urges, null if not enough data. */
  riskiestHour: number | null;
  riskiestWeekday: number | null;
  topTriggers: { key: TriggerKey; count: number }[];
  avgIntensity: number | null;
  avgDurationSec: number | null;
  /** Urges per day over the window, oldest first. */
  dailyCounts: { day: string; count: number; resisted: number; relapsed: number }[];
  hourHistogram: number[];
}

function mode(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  let best: number | null = null;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      bestCount = count;
      best = value;
    }
  });
  // A "pattern" needs at least two occurrences to be worth reporting.
  return bestCount >= 2 ? best : null;
}

export function analyzeUrges(urges: UrgeRecord[], sinceMs?: number, windowDays = 7): UrgeInsights {
  const scoped = sinceMs ? urges.filter((u) => u.startedAt >= sinceMs) : urges;
  const finished = scoped.filter((u) => u.outcome !== 'ongoing');
  const resisted = finished.filter((u) => u.outcome === 'resisted').length;
  const relapsed = finished.filter((u) => u.outcome === 'relapsed').length;

  const triggerCounts = new Map<TriggerKey, number>();
  scoped.forEach((u) => (u.triggers ?? []).forEach((t) => triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1)));
  const topTriggers = [...triggerCounts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const intensities = scoped.map((u) => u.intensity).filter((i): i is number => typeof i === 'number');
  const durations = finished.map((u) => u.durationSec).filter((d): d is number => typeof d === 'number');

  const hourHistogram = Array.from({ length: 24 }, () => 0);
  scoped.forEach((u) => {
    hourHistogram[hourOf(u.startedAt)] += 1;
  });

  const dailyMap = new Map<string, { count: number; resisted: number; relapsed: number }>();
  for (let i = windowDays - 1; i >= 0; i--) {
    dailyMap.set(dayKey(Date.now() - i * 86400000), { count: 0, resisted: 0, relapsed: 0 });
  }
  scoped.forEach((u) => {
    const key = dayKey(u.startedAt);
    const entry = dailyMap.get(key);
    if (!entry) return;
    entry.count += 1;
    if (u.outcome === 'resisted') entry.resisted += 1;
    if (u.outcome === 'relapsed') entry.relapsed += 1;
  });

  return {
    total: scoped.length,
    resisted,
    relapsed,
    resistRate: finished.length > 0 ? Math.round((resisted / finished.length) * 100) : 0,
    riskiestHour: mode(scoped.map((u) => hourOf(u.startedAt))),
    riskiestWeekday: mode(scoped.map((u) => weekdayOf(u.startedAt))),
    topTriggers,
    avgIntensity: intensities.length > 0 ? intensities.reduce((a, b) => a + b, 0) / intensities.length : null,
    avgDurationSec: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    dailyCounts: [...dailyMap.entries()].map(([day, v]) => ({ day, ...v })),
    hourHistogram,
  };
}

const MOOD_SCORE: Record<Mood, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };

export function averageMood(checkIns: CheckIn[], sinceMs?: number): number | null {
  const scoped = sinceMs ? checkIns.filter((c) => c.at >= sinceMs) : checkIns;
  if (scoped.length === 0) return null;
  return scoped.reduce((sum, c) => sum + MOOD_SCORE[c.mood], 0) / scoped.length;
}

/** Arabic counts need three forms; getting this wrong reads as machine output. */
function arTimes(n: number): string {
  if (n === 1) return 'مرة واحدة';
  if (n === 2) return 'مرتين';
  if (n <= 10) return `${n} مرات`;
  return `${n} مرة`;
}

function formatDuration(sec: number, lang: Lang): string {
  if (sec < 60) {
    const rounded = Math.max(1, Math.round(sec));
    return lang === 'ar' ? `${rounded} ثانية` : `${rounded} seconds`;
  }
  const mins = Math.round(sec / 60);
  return lang === 'ar' ? `${mins} دقيقة` : `${mins} minutes`;
}

/**
 * Turns the numbers into plain-language observations. Only states a pattern
 * when there's enough data to justify it — confident-sounding advice derived
 * from a single logged urge is worse than saying nothing.
 */
export function describeInsights(insights: UrgeInsights, lang: Lang): string[] {
  const lines: string[] = [];
  const ar = lang === 'ar';

  if (insights.total === 0) {
    return [ar ? 'لا توجد رغبات مسجّلة في هذه الفترة.' : 'No urges logged in this period.'];
  }

  // Below this, there simply isn't a "pattern" to report yet.
  const MIN_FOR_PATTERN = 3;
  if (insights.total < MIN_FOR_PATTERN) {
    return [
      ar
        ? `سجّلت ${arTimes(insights.total)} حتى الآن. سجّل بضع لحظات أخرى وسأبدأ في كشف أنماطك الحقيقية.`
        : `You've logged ${insights.total} so far. Log a few more and I'll start surfacing your real patterns.`,
    ];
  }

  if (insights.riskiestHour !== null) {
    const range = formatClockRange(insights.riskiestHour, lang);
    lines.push(
      ar
        ? `أكثر أوقاتك خطورة حول ${range} — خطّط لهذا الوقت مسبقاً بدل أن تواجهه فجأة.`
        : `Your riskiest window is around ${range} — plan for it in advance instead of meeting it cold.`
    );
  }

  if (insights.riskiestWeekday !== null) {
    const dayName = WEEKDAY_NAMES[lang][insights.riskiestWeekday];
    lines.push(ar ? `يوم ${dayName} هو أكثر أيامك تكراراً للرغبات.` : `${dayName} is your most frequent urge day.`);
  }

  // One tagged occurrence is a data point, not a trigger pattern.
  if (insights.topTriggers.length > 0 && insights.topTriggers[0].count >= 2) {
    const top = insights.topTriggers[0];
    lines.push(
      ar
        ? `المحفّز الأول لديك هو "${triggerLabel(top.key, 'ar')}" (${arTimes(top.count)}). عالج هذا السبب وستقل الرغبات نفسها.`
        : `Your top trigger is "${triggerLabel(top.key, 'en')}" (${top.count}×). Address that cause and the urges themselves drop.`
    );
  }

  if (insights.avgDurationSec !== null) {
    const duration = formatDuration(insights.avgDurationSec, lang);
    lines.push(
      ar
        ? `متوسط مدة مقاومتك ${duration}. الرغبة موجة تنتهي، وأنت أثبتّ ذلك بنفسك.`
        : `Your average urge lasts ${duration}. Cravings are waves that end — you've proven that yourself.`
    );
  }

  if (insights.avgIntensity !== null) {
    lines.push(
      ar
        ? `متوسط شدة الرغبة ${insights.avgIntensity.toFixed(1)} من 10.`
        : `Average craving intensity: ${insights.avgIntensity.toFixed(1)} out of 10.`
    );
  }

  return lines;
}
