import { analyzeUrges, describeInsights, averageMood } from '../analytics';
import { copingFor } from '../coping';
import { daysAgo, dayKey } from '../dates';
import { randomAyah, AYAT } from '../quotes';
import { rankForDays, nextRank } from '../ranks';
import { MILESTONES } from '../milestones';
import { TRIGGERS, triggerLabel } from '../triggers';
import { computeCurrentStreakDays, computeTotalScore } from '../derived';
import { searchJournal } from './retrieval';
import type { Lang } from '../i18n';
import type { AppState, TriggerKey } from '../types';

/**
 * A tool the assistant can call. `input_schema` follows the Anthropic tool
 * format so the same definitions drive both the real API and the offline
 * fallback provider — there is no second source of truth to keep in sync.
 */
export interface AITool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** Everything a tool handler is allowed to read or do. */
export interface ToolContext {
  lang: Lang;
  state: AppState;
  actions: {
    addReason: (reason: string) => void;
    logPastUrge: (input: {
      feeling: string;
      why: string;
      outcome: 'resisted' | 'relapsed';
      minutesAgo: number;
      triggers?: TriggerKey[];
      intensity?: number | null;
    }) => void;
  };
}

/**
 * What a handler returns. `text` goes back to the model as the tool result;
 * `uiAction` is consumed by the chat screen to render something (a breathing
 * orb, a navigation prompt) that plain text can't express.
 */
export interface ToolResult {
  text: string;
  uiAction?: { type: 'breathing' | 'open_urge_screen' | 'verse'; payload?: string };
}

type Handler = (input: any, ctx: ToolContext) => ToolResult;

function habitName(ctx: ToolContext): string {
  const h = ctx.state.habit;
  if (!h) return ctx.lang === 'ar' ? 'العادة' : 'the habit';
  return ctx.lang === 'ar' ? h.nameAr : h.nameEn;
}

function fmt(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

const TOOL_LIST: { def: AITool; handler: Handler }[] = [
  {
    def: {
      name: 'get_stats',
      description:
        "Read the user's current recovery statistics: clean streak, best streak, urges resisted, relapse count, rank, and total score. Call this whenever the user asks how they are doing, how long they have lasted, or before giving encouragement that references numbers — never guess these values.",
      input_schema: { type: 'object', properties: {} },
    },
    handler: (_input, ctx) => {
      const s = ctx.state;
      const streakDays = computeCurrentStreakDays(s.streakStartedAt);
      const rank = rankForDays(streakDays);
      const next = nextRank(streakDays);
      return {
        text: fmt({
          habit: habitName(ctx),
          clean_streak_days: Number(streakDays.toFixed(2)),
          best_streak_days: Number(s.bestStreakDays.toFixed(2)),
          urges_resisted: s.resistedCount,
          relapses: s.relapseCount,
          total_urges_logged: s.urges.length,
          total_score: computeTotalScore(s.lifetimeCleanDaysBanked, s.streakStartedAt, s.resistedCount),
          current_rank: ctx.lang === 'ar' ? rank.nameAr : rank.nameEn,
          next_rank: next ? (ctx.lang === 'ar' ? next.nameAr : next.nameEn) : null,
          days_to_next_rank: next ? Number(Math.max(0, next.minDays - streakDays).toFixed(1)) : null,
          journey_started: s.journeyStartedAt ? dayKey(s.journeyStartedAt) : null,
        }),
      };
    },
  },
  {
    def: {
      name: 'get_urge_history',
      description:
        'Read the individual urges the user has logged, most recent first. Use when the user asks about a specific past moment, or when you need the raw entries rather than aggregate patterns.',
      input_schema: {
        type: 'object',
        properties: {
          days_back: { type: 'number', description: 'Only include urges from the last N days. Omit for all time.' },
          outcome: { type: 'string', enum: ['resisted', 'relapsed', 'any'], description: 'Filter by outcome.' },
          limit: { type: 'number', description: 'Maximum entries to return (default 10, max 50).' },
        },
      },
    },
    handler: (input, ctx) => {
      const limit = Math.min(50, Math.max(1, input?.limit ?? 10));
      const since = input?.days_back ? daysAgo(input.days_back) : 0;
      const outcome = input?.outcome && input.outcome !== 'any' ? input.outcome : null;
      const rows = ctx.state.urges
        .filter((u) => u.startedAt >= since && (!outcome || u.outcome === outcome))
        .slice(0, limit)
        .map((u) => ({
          when: new Date(u.startedAt).toISOString(),
          outcome: u.outcome,
          intensity: u.intensity,
          duration_minutes: u.durationSec != null ? Math.round(u.durationSec / 60) : null,
          triggers: (u.triggers ?? []).map((t) => triggerLabel(t, 'en')),
          feeling: u.feeling || null,
          why: u.why || null,
        }));
      return { text: fmt({ count: rows.length, urges: rows }) };
    },
  },
  {
    def: {
      name: 'get_patterns',
      description:
        "Analyze the user's logged urges for real patterns: riskiest hour of day, riskiest weekday, most common triggers, average craving intensity and duration. Call this before offering any advice about *when* or *why* the user struggles, so the advice is grounded in their own data rather than generic.",
      input_schema: {
        type: 'object',
        properties: {
          days_back: { type: 'number', description: 'Window to analyze in days. Omit to analyze all history.' },
        },
      },
    },
    handler: (input, ctx) => {
      const since = input?.days_back ? daysAgo(input.days_back) : undefined;
      const insights = analyzeUrges(ctx.state.urges, since, input?.days_back ?? 7);
      return {
        text: fmt({
          total_urges: insights.total,
          resisted: insights.resisted,
          relapsed: insights.relapsed,
          resist_rate_percent: insights.resistRate,
          riskiest_hour_of_day: insights.riskiestHour,
          riskiest_weekday: insights.riskiestWeekday,
          top_triggers: insights.topTriggers.map((t) => ({ trigger: triggerLabel(t.key, 'en'), count: t.count })),
          average_intensity_of_10: insights.avgIntensity != null ? Number(insights.avgIntensity.toFixed(1)) : null,
          average_duration_seconds: insights.avgDurationSec != null ? Math.round(insights.avgDurationSec) : null,
          average_mood_of_5: averageMood(ctx.state.checkIns, since),
          plain_language_summary: describeInsights(insights, ctx.lang),
        }),
      };
    },
  },
  {
    def: {
      name: 'get_my_reasons',
      description:
        "Read back the user's own written reasons for quitting, captured when they were calm. Call this when the user is tempted, wavering, or asks why they started — showing someone their own words is far stronger than anything you can compose.",
      input_schema: { type: 'object', properties: {} },
    },
    handler: (_input, ctx) => ({
      text: fmt({ reasons: ctx.state.habit?.reasons ?? [], habit_description: ctx.state.habit?.rawDescription ?? null }),
    }),
  },
  {
    def: {
      name: 'add_reason',
      description:
        "Save a new personal reason for quitting, in the user's own words. Only call this when the user clearly states a reason they want remembered — do not invent reasons on their behalf.",
      input_schema: {
        type: 'object',
        properties: { reason: { type: 'string', description: "The reason, phrased in the user's own words." } },
        required: ['reason'],
      },
    },
    handler: (input, ctx) => {
      const reason = String(input?.reason ?? '').trim();
      if (!reason) return { text: fmt({ ok: false, error: 'empty_reason' }) };
      ctx.actions.addReason(reason);
      return { text: fmt({ ok: true, saved: reason }) };
    },
  },
  {
    def: {
      name: 'suggest_coping_exercise',
      description:
        "Get a concrete coping action tailored to this user's specific habit and current emotional trigger. Prefer this over inventing generic advice — these are chosen to match the habit.",
      input_schema: {
        type: 'object',
        properties: {
          trigger: {
            type: 'string',
            enum: TRIGGERS.map((t) => t.key),
            description: 'The state the user is in right now, if known.',
          },
        },
      },
    },
    handler: (input, ctx) => {
      const exercise = copingFor(ctx.state.habit?.key, ctx.lang);
      const trigger = TRIGGERS.find((t) => t.key === input?.trigger);
      return {
        text: fmt({
          exercise: `${exercise.icon} ${exercise.text}`,
          trigger_specific_tip: trigger ? (ctx.lang === 'ar' ? trigger.tipAr : trigger.tipEn) : null,
        }),
      };
    },
  },
  {
    def: {
      name: 'get_quran_verse',
      description:
        'Retrieve a short Quranic verse on patience, self-restraint, hope, or repentance, with its reference and a brief reflection. Use when the user asks for spiritual encouragement. Always quote the Arabic exactly as returned — never paraphrase scripture or compose your own verse.',
      input_schema: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            enum: ['patience', 'hope', 'repentance', 'self_restraint', 'any'],
            description: 'Preferred theme. Falls back to any verse if none matches.',
          },
        },
      },
    },
    handler: (input, ctx) => {
      const themeMap: Record<string, string[]> = {
        patience: ['baqarah-153', 'baqarah-155', 'baqarah-45', 'inshirah-6'],
        hope: ['inshirah-6', 'zumar-53', 'talaq-2-3'],
        repentance: ['zumar-53', 'nur-31'],
        self_restraint: ['naziat-40', 'yusuf-53', 'ankabut-69'],
      };
      const ids = themeMap[input?.theme as string];
      const pool = ids ? AYAT.filter((a) => ids.includes(a.id)) : AYAT;
      const ayah = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : randomAyah();
      return {
        text: fmt({
          arabic: ayah.arabic,
          reference: ayah.reference,
          meaning_en: ayah.meaningEn,
          reflection: ctx.lang === 'ar' ? ayah.reflectionAr : ayah.reflectionEn,
        }),
        uiAction: { type: 'verse', payload: ayah.id },
      };
    },
  },
  {
    def: {
      name: 'start_breathing_exercise',
      description:
        'Display an animated guided breathing exercise (4-7-8) on screen for the user to follow. Call this when the user is panicking, highly aroused, or asks to calm down.',
      input_schema: { type: 'object', properties: {} },
    },
    handler: (_input, ctx) => ({
      text: fmt({ ok: true, note: 'A guided 4-7-8 breathing animation is now displayed to the user.' }),
      uiAction: { type: 'breathing' },
    }),
  },
  {
    def: {
      name: 'log_urge',
      description:
        'Record an urge the user already went through but never logged. Only call this when the user describes a past urge and its outcome. For an urge happening RIGHT NOW, call open_urge_screen instead so the live timer runs.',
      input_schema: {
        type: 'object',
        properties: {
          outcome: { type: 'string', enum: ['resisted', 'relapsed'], description: 'How it ended.' },
          minutes_ago: { type: 'number', description: 'How long ago it started, in minutes.' },
          feeling: { type: 'string', description: 'What the user felt, in their words.' },
          why: { type: 'string', description: 'Why they wanted to act, in their words.' },
          triggers: {
            type: 'array',
            items: { type: 'string', enum: TRIGGERS.map((t) => t.key) },
            description: 'Emotional triggers involved.',
          },
          intensity: { type: 'number', description: 'Craving strength from 1 to 10.' },
        },
        required: ['outcome'],
      },
    },
    handler: (input, ctx) => {
      const outcome = input?.outcome === 'relapsed' ? 'relapsed' : 'resisted';
      ctx.actions.logPastUrge({
        feeling: String(input?.feeling ?? ''),
        why: String(input?.why ?? ''),
        outcome,
        minutesAgo: Number(input?.minutes_ago ?? 0),
        triggers: Array.isArray(input?.triggers) ? (input.triggers as TriggerKey[]) : [],
        intensity: typeof input?.intensity === 'number' ? input.intensity : null,
      });
      return { text: fmt({ ok: true, logged: outcome }) };
    },
  },
  {
    def: {
      name: 'open_urge_screen',
      description:
        'Offer the user the live "fight mode" screen, which starts a timer and gives them one-tap coping actions. Call this when the user says they are having an urge right now.',
      input_schema: { type: 'object', properties: {} },
    },
    handler: () => ({
      text: fmt({ ok: true, note: 'The user has been offered a button to open the live fight-mode screen.' }),
      uiAction: { type: 'open_urge_screen' },
    }),
  },
  {
    def: {
      name: 'get_check_ins',
      description:
        "Read the user's daily mood check-ins. Useful for connecting how they have been feeling to when they struggle.",
      input_schema: {
        type: 'object',
        properties: { days_back: { type: 'number', description: 'Window in days (default 14).' } },
      },
    },
    handler: (input, ctx) => {
      const since = daysAgo(input?.days_back ?? 14);
      const rows = ctx.state.checkIns
        .filter((c) => c.at >= since)
        .map((c) => ({ day: c.day, mood: c.mood, note: c.note || null }));
      return { text: fmt({ count: rows.length, check_ins: rows }) };
    },
  },
  {
    def: {
      name: 'search_my_journal',
      description:
        "Search everything the user has personally written — urge notes, reasons, and check-in notes — for entries relevant to a query. Use this to ground your reply in what they actually said before, rather than generalities. This is the user's private record; quote it back gently.",
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to look for, e.g. "loneliness at night" or "work stress".' },
          limit: { type: 'number', description: 'Max snippets to return (default 5).' },
        },
        required: ['query'],
      },
    },
    handler: (input, ctx) => {
      const hits = searchJournal(ctx.state, String(input?.query ?? ''), Math.min(10, input?.limit ?? 5));
      return { text: fmt({ count: hits.length, entries: hits }) };
    },
  },
  {
    def: {
      name: 'get_milestones',
      description:
        'List which achievements the user has already earned and which are still locked, with how far off they are. Use when celebrating progress or showing what is within reach.',
      input_schema: { type: 'object', properties: {} },
    },
    handler: (_input, ctx) => {
      const earned = ctx.state.unlockedMilestones;
      return {
        text: fmt({
          earned: MILESTONES.filter((m) => earned.includes(m.key)).map((m) =>
            ctx.lang === 'ar' ? m.titleAr : m.titleEn
          ),
          locked: MILESTONES.filter((m) => !earned.includes(m.key)).map((m) =>
            ctx.lang === 'ar' ? m.titleAr : m.titleEn
          ),
        }),
      };
    },
  },
];

export const AI_TOOLS: AITool[] = TOOL_LIST.map((t) => t.def);

export function executeTool(name: string, input: unknown, ctx: ToolContext): ToolResult {
  const entry = TOOL_LIST.find((t) => t.def.name === name);
  if (!entry) return { text: fmt({ ok: false, error: `unknown_tool:${name}` }) };
  try {
    return entry.handler(input ?? {}, ctx);
  } catch (e) {
    return { text: fmt({ ok: false, error: e instanceof Error ? e.message : 'tool_failed' }) };
  }
}

export function toolDisplayName(name: string, lang: Lang): string {
  const ar: Record<string, string> = {
    get_stats: 'قرأ إحصائياتك',
    get_urge_history: 'راجع سجل رغباتك',
    get_patterns: 'حلّل أنماطك',
    get_my_reasons: 'استرجع أسبابك',
    add_reason: 'حفظ سبباً جديداً',
    suggest_coping_exercise: 'اختار تمريناً مناسباً',
    get_quran_verse: 'أحضر آية',
    start_breathing_exercise: 'بدأ تمرين تنفّس',
    log_urge: 'سجّل رغبة سابقة',
    open_urge_screen: 'فتح وضع المقاومة',
    get_check_ins: 'راجع مزاجك',
    search_my_journal: 'بحث في مذكراتك',
    get_milestones: 'راجع إنجازاتك',
  };
  const en: Record<string, string> = {
    get_stats: 'read your stats',
    get_urge_history: 'reviewed your urge log',
    get_patterns: 'analyzed your patterns',
    get_my_reasons: 'recalled your reasons',
    add_reason: 'saved a new reason',
    suggest_coping_exercise: 'picked a coping exercise',
    get_quran_verse: 'fetched a verse',
    start_breathing_exercise: 'started a breathing session',
    log_urge: 'logged a past urge',
    open_urge_screen: 'opened fight mode',
    get_check_ins: 'reviewed your moods',
    search_my_journal: 'searched your journal',
    get_milestones: 'reviewed your achievements',
  };
  return (lang === 'ar' ? ar : en)[name] ?? name;
}
