import { randomAyah } from './quotes';
import { rankForDays } from './ranks';
import { analyzeUrges, describeInsights, averageMood } from './analytics';
import { copingFor } from './coping';
import { daysAgo } from './dates';
import { triggerLabel } from './triggers';
import type { Lang } from './i18n';
import type { CheckIn, Habit, UrgeRecord } from './types';

export type ToolKey = 'stats' | 'exercise' | 'logUrge' | 'verse' | 'weekly' | 'breathing';

export interface AssistantContext {
  lang: Lang;
  habit: Habit | null;
  currentStreakDays: number;
  bestStreakDays: number;
  totalScore: number;
  resistedCount: number;
  relapseCount: number;
  urges: UrgeRecord[];
  checkIns: CheckIn[];
}

export interface AssistantReply {
  text: string;
  kind?: 'text' | 'breathing' | 'verse';
  ayahId?: string;
}

function fmtDays(n: number, lang: Lang): string {
  const v = Math.floor(n);
  return lang === 'ar' ? `${v} يوم` : `${v} day${v === 1 ? '' : 's'}`;
}

function habitName(habit: Habit | null, lang: Lang): string {
  if (!habit) return lang === 'ar' ? 'عادتك' : 'your habit';
  return lang === 'ar' ? habit.nameAr : habit.nameEn;
}

function statsReply(ctx: AssistantContext): string {
  const { lang } = ctx;
  const rank = rankForDays(ctx.currentStreakDays);
  const rankName = lang === 'ar' ? rank.nameAr : rank.nameEn;
  const all = analyzeUrges(ctx.urges);

  const head =
    lang === 'ar'
      ? [
          `إليك لمحة عن رحلتك مع ${habitName(ctx.habit, lang)}:`,
          `• صامد الآن منذ ${fmtDays(ctx.currentStreakDays, lang)}`,
          `• أفضل رقم لك: ${fmtDays(ctx.bestStreakDays, lang)}`,
          `• رغبات قاومتها: ${all.resisted} من أصل ${all.total}`,
          `• مرات الانتكاس: ${ctx.relapseCount}`,
          `• رتبتك الحالية: ${rank.icon} ${rankName}`,
        ]
      : [
          `Here's a look at your journey with ${habitName(ctx.habit, lang)}:`,
          `• Currently clean for ${fmtDays(ctx.currentStreakDays, lang)}`,
          `• Best streak: ${fmtDays(ctx.bestStreakDays, lang)}`,
          `• Urges resisted: ${all.resisted} of ${all.total}`,
          `• Relapses: ${ctx.relapseCount}`,
          `• Current rank: ${rank.icon} ${rankName}`,
        ];

  const insights = all.total > 0 ? describeInsights(all, lang) : [];
  const tail =
    all.total === 0
      ? [lang === 'ar' ? 'لم تُسجَّل أي رغبة بعد — سجّل أول لحظة وسأبدأ في كشف أنماطك.' : 'No urges logged yet — log your first moment and I’ll start surfacing your patterns.']
      : insights;

  return [...head, '', ...tail].join('\n');
}

function weeklyReply(ctx: AssistantContext): string {
  const { lang } = ctx;
  const week = analyzeUrges(ctx.urges, daysAgo(7), 7);
  const prev = analyzeUrges(
    ctx.urges.filter((u) => u.startedAt < daysAgo(7)),
    daysAgo(14),
    7
  );

  if (week.total === 0) {
    return lang === 'ar'
      ? 'الأسبوع الماضي هادئ — لم تُسجَّل أي رغبات. إن كان هذا صحيحاً فهو إنجاز حقيقي، وإن كنت نسيت التسجيل فحاول توثيق لحظاتك القادمة حتى أستطيع كشف أنماطك.'
      : "Last week was quiet — no urges logged. If that's accurate it's a real achievement; if you just forgot to log, try capturing the next ones so I can surface your patterns.";
  }

  const lines =
    lang === 'ar'
      ? [
          'تقرير آخر 7 أيام:',
          `• الرغبات المسجّلة: ${week.total}`,
          `• قاومتها: ${week.resisted}`,
          `• استسلمت فيها: ${week.relapsed}`,
          `• نسبة الصمود: ${week.resistRate}%`,
        ]
      : [
          'Report for the last 7 days:',
          `• Urges logged: ${week.total}`,
          `• Resisted: ${week.resisted}`,
          `• Relapsed: ${week.relapsed}`,
          `• Resist rate: ${week.resistRate}%`,
        ];

  if (prev.total > 0) {
    const diff = week.total - prev.total;
    if (diff !== 0) {
      lines.push(
        lang === 'ar'
          ? `• مقارنة بالأسبوع السابق: ${diff > 0 ? 'زادت' : 'قلّت'} الرغبات بمقدار ${Math.abs(diff)}`
          : `• Versus the week before: urges ${diff > 0 ? 'up' : 'down'} by ${Math.abs(diff)}`
      );
    }
  }

  const mood = averageMood(ctx.checkIns, daysAgo(7));
  if (mood !== null) {
    lines.push(
      lang === 'ar' ? `• متوسط مزاجك هذا الأسبوع: ${mood.toFixed(1)} من 5` : `• Average mood this week: ${mood.toFixed(1)} of 5`
    );
  }

  return [...lines, '', ...describeInsights(week, lang)].join('\n');
}

function exerciseReply(ctx: AssistantContext): string {
  const { lang } = ctx;
  const recent = ctx.urges[0];
  const exercise = copingFor(ctx.habit?.key, lang);

  // If they just tagged a trigger, lead with the counter-move for that state.
  const lastTrigger = recent?.triggers?.[0];
  if (lastTrigger) {
    return lang === 'ar'
      ? `بما أنك سجّلت "${triggerLabel(lastTrigger, 'ar')}" مؤخراً، جرّب هذا:\n\n${exercise.icon} ${exercise.text}`
      : `Since you recently tagged "${triggerLabel(lastTrigger, 'en')}", try this:\n\n${exercise.icon} ${exercise.text}`;
  }

  return `${exercise.icon} ${exercise.text}`;
}

function verseReply(lang: Lang): { text: string; ayahId: string } {
  const ayah = randomAyah();
  const text =
    lang === 'ar'
      ? `${ayah.arabic}\n\n( ${ayah.reference} )\n\n${ayah.reflectionAr}`
      : `${ayah.arabic}\n\n"${ayah.meaningEn}"\n( ${ayah.reference} )\n\n${ayah.reflectionEn}`;
  return { text, ayahId: ayah.id };
}

function logUrgeReply(lang: Lang): string {
  return lang === 'ar'
    ? 'تمام. اضغط زر "أشعر برغبة الآن" في الرئيسية وسأرافقك خطوة بخطوة: تحدد محفّزك بضغطة، وتقيّم شدة الرغبة، وتكتب ما تشعر به إن أردت.'
    : 'Got it. Tap "I feel an urge now" on Home and I’ll walk you through it: tag your trigger in one tap, rate the intensity, and write how you feel if you want to.';
}

function breathingReply(lang: Lang): string {
  return lang === 'ar'
    ? 'لنبدأ تمرين تنفّس بسيط: شهيق 4 ثوانٍ، احبس 7 ثوانٍ، زفير 8 ثوانٍ. كرّرها 4 مرات وراقب الدائرة أدناه.'
    : "Let's do a simple breathing exercise: inhale 4 seconds, hold 7, exhale 8. Repeat 4 times and follow the circle below.";
}

export function respondToTool(tool: ToolKey, ctx: AssistantContext): AssistantReply {
  switch (tool) {
    case 'stats':
      return { text: statsReply(ctx) };
    case 'weekly':
      return { text: weeklyReply(ctx) };
    case 'exercise':
      return { text: exerciseReply(ctx) };
    case 'logUrge':
      return { text: logUrgeReply(ctx.lang) };
    case 'verse': {
      const { text, ayahId } = verseReply(ctx.lang);
      return { text, kind: 'verse', ayahId };
    }
    case 'breathing':
      return { text: breathingReply(ctx.lang), kind: 'breathing' };
    default:
      return { text: '' };
  }
}

const AR_KEYWORDS = {
  urge: ['رغبة', 'أريد', 'اريد', 'مغري', 'ضعيف', 'مشتهي'],
  sad: ['حزين', 'زعلان', 'مكتئب', 'تعبان', 'وحيد', 'يائس'],
  relapsed: ['انتكست', 'سقطت', 'فشلت', 'استسلمت', 'رجعت'],
  thanks: ['شكرا', 'شكراً', 'يعطيك العافية'],
  greeting: ['السلام', 'مرحبا', 'اهلا', 'أهلا'],
  why: ['لماذا اترك', 'ليش اترك', 'سبب', 'نسيت ليش'],
};

const EN_KEYWORDS = {
  urge: ['urge', 'want to', 'tempted', 'craving', 'weak', 'horny'],
  sad: ['sad', 'depressed', 'tired', 'lonely', 'down', 'hopeless'],
  relapsed: ['relapsed', 'failed', 'gave in', 'i slipped', 'messed up'],
  thanks: ['thanks', 'thank you'],
  greeting: ['hello', 'hi', 'salam'],
  why: ['why did i quit', 'why am i doing this', 'forgot why', 'my reasons'],
};

export function respondToFreeText(text: string, ctx: AssistantContext): AssistantReply {
  const { lang } = ctx;
  const lower = text.toLowerCase();
  const kw = lang === 'ar' ? AR_KEYWORDS : EN_KEYWORDS;
  const matches = (arr: string[]) => arr.some((k) => lower.includes(k.toLowerCase()));

  const reasons = ctx.habit?.reasons ?? [];

  if (matches(kw.why) && reasons.length > 0) {
    const list = reasons.map((r) => `• ${r}`).join('\n');
    return {
      text:
        lang === 'ar'
          ? `هذه كلماتك أنت، كتبتها حين كنت صافي الذهن:\n\n${list}\n\nلم يتغيّر شيء من هذا الآن.`
          : `These are your own words, written when your head was clear:\n\n${list}\n\nNone of that has changed right now.`,
    };
  }

  if (matches(kw.urge)) {
    const exercise = copingFor(ctx.habit?.key, lang);
    const reasonLine =
      reasons.length > 0
        ? lang === 'ar'
          ? `\n\nوتذكّر ما كتبته بنفسك: "${reasons[0]}"`
          : `\n\nAnd remember what you wrote yourself: "${reasons[0]}"`
        : '';
    return {
      text:
        (lang === 'ar'
          ? `أشعر أنك في لحظة صعبة. قاومت من قبل ${ctx.resistedCount} مرة، وتستطيع تكرارها الآن.\n\n${exercise.icon} ${exercise.text}\n\nواضغط "أشعر برغبة الآن" في الرئيسية لتبدأ عدّاد المقاومة.`
          : `Sounds like a hard moment. You've resisted ${ctx.resistedCount} times before and you can do it again.\n\n${exercise.icon} ${exercise.text}\n\nTap "I feel an urge now" on Home to start the fight timer.`) + reasonLine,
    };
  }

  if (matches(kw.relapsed)) {
    return {
      text:
        lang === 'ar'
          ? 'لا بأس أبداً. الانتكاس ليس نهاية الطريق، بل جزء مسجَّل من رحلتك الكاملة. أخطر شيء بعد السقوط ليس السقوط نفسه، بل الشعور بأن كل شيء ضاع فتستمر. لم يضع شيء: أيامك السابقة محفوظة كلها. هل تريد أن نراجع ما الذي سبق هذه المرة؟'
          : "It's genuinely okay. A relapse isn't the end of the road — it's a recorded part of your whole journey. The dangerous part after a fall isn't the fall, it's feeling like everything is lost so you keep going. Nothing is lost: all your previous days are saved. Want to look at what led up to it this time?",
    };
  }

  if (matches(kw.sad)) {
    return {
      text:
        lang === 'ar'
          ? 'مشاعر الحزن والتعب من أقوى المحفّزات. جرّب أن تسجّل حالتك اليوم في "كيف حالك اليوم؟"، أو اطلب مني "تمرين تنفّس" لنهدأ سوياً. ولو كان الأمر أثقل من ذلك، لا تحمله وحدك.'
          : 'Sadness and exhaustion are among the strongest triggers. Try logging today in "How are you today?", or ask me for a breathing session. And if it’s heavier than that, don’t carry it alone.',
    };
  }

  if (matches(kw.thanks)) {
    return {
      text: lang === 'ar' ? 'أنا معك دائماً في هذه الرحلة، لا تتردد بالعودة في أي وقت. 🤍' : "I'm always with you on this journey — come back anytime. 🤍",
    };
  }

  if (matches(kw.greeting)) {
    return {
      text:
        lang === 'ar'
          ? `أهلاً بك! أنت الآن صامد منذ ${fmtDays(ctx.currentStreakDays, lang)}. كيف يمكنني مساعدتك اليوم؟`
          : `Welcome! You're currently clean for ${fmtDays(ctx.currentStreakDays, lang)}. How can I help you today?`,
    };
  }

  return {
    text:
      lang === 'ar'
        ? 'أنا هنا لأساعدك. يمكنك أن تسألني عن إحصائياتك وأنماطك، أو تطلب تمريناً للتهدئة، أو آية للتدبر، أو ببساطة تكتب ما يجول بخاطرك.'
        : "I'm here to help. Ask me about your stats and patterns, request a calming exercise, a verse to reflect on, or simply write what's on your mind.",
  };
}
