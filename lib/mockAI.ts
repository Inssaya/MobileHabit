import { randomAyah } from './quotes';
import { rankForDays, nextRank } from './ranks';
import type { Lang } from './i18n';
import type { Habit, UrgeRecord } from './types';

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
  const total = ctx.urges.length;
  if (lang === 'ar') {
    return [
      `إليك لمحة عن رحلتك مع ${habitName(ctx.habit, ctx.lang)}:`,
      `• صامد الآن منذ ${fmtDays(ctx.currentStreakDays, lang)}`,
      `• أفضل رقم لك: ${fmtDays(ctx.bestStreakDays, lang)}`,
      `• رغبات قاومتها: ${ctx.resistedCount} من أصل ${total}`,
      `• مرات الانتكاس: ${ctx.relapseCount}`,
      `• رتبتك الحالية: ${rank.icon} ${rankName}`,
      total > 0
        ? `نسبة صمودك حتى الآن ${Math.round((ctx.resistedCount / total) * 100)}%. استمر، كل رقم هنا هو دليل على قوتك.`
        : `لم تُسجَّل أي رغبة بعد — ابدأ اليوم وسجّل أول خطوة.`,
    ].join('\n');
  }
  return [
    `Here's a look at your journey with ${habitName(ctx.habit, ctx.lang)}:`,
    `• Currently clean for ${fmtDays(ctx.currentStreakDays, lang)}`,
    `• Best streak: ${fmtDays(ctx.bestStreakDays, lang)}`,
    `• Urges resisted: ${ctx.resistedCount} of ${total}`,
    `• Relapses: ${ctx.relapseCount}`,
    `• Current rank: ${rank.icon} ${rankName}`,
    total > 0
      ? `Your resist rate so far is ${Math.round((ctx.resistedCount / total) * 100)}%. Keep going — every number here proves your strength.`
      : `No urges logged yet — start today and log your first step.`,
  ].join('\n');
}

function weeklyReply(ctx: AssistantContext): string {
  const { lang } = ctx;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekUrges = ctx.urges.filter((u) => u.startedAt >= weekAgo);
  const resisted = weekUrges.filter((u) => u.outcome === 'resisted').length;
  const relapsed = weekUrges.filter((u) => u.outcome === 'relapsed').length;

  if (lang === 'ar') {
    if (weekUrges.length === 0) {
      return 'الأسبوع الماضي هادئ — لم تُسجَّل أي رغبات. إن كان هذا صحيحاً فهو إنجاز رائع، وإن كنت نسيت التسجيل فحاول توثيق لحظاتك القادمة.';
    }
    return [
      `تقرير آخر 7 أيام:`,
      `• عدد الرغبات المسجّلة: ${weekUrges.length}`,
      `• قاومتها: ${resisted}`,
      `• استسلمت فيها: ${relapsed}`,
      relapsed === 0
        ? 'أسبوع نظيف بالكامل! هذا يستحق الاحتفال.'
        : 'كل انتكاسة تعطيك معلومة عن المحفزات — راجع أوقاتها وابحث عن نمط مشترك.',
    ].join('\n');
  }
  if (weekUrges.length === 0) {
    return "Last week was quiet — no urges logged. If that's accurate, that's a great result; if you simply forgot to log, try capturing the next ones.";
  }
  return [
    'Report for the last 7 days:',
    `• Urges logged: ${weekUrges.length}`,
    `• Resisted: ${resisted}`,
    `• Relapsed: ${relapsed}`,
    relapsed === 0
      ? 'A fully clean week! That deserves a celebration.'
      : 'Every relapse teaches you about your triggers — review the times and look for a pattern.',
  ].join('\n');
}

function exerciseReply(lang: Lang): string {
  const ar = [
    'جرّب هذا الآن: قف، اشرب كوب ماء بارد ببطء، ثم امشِ 20 خطوة وأنت تعدّ أنفاسك. الرغبة موجة تعلو ثم تنزل خلال دقائق.',
    'افتح المصحف أو استمع لآيات قصيرة الآن، وردّد استغفاراً بصوت مسموع 10 مرات.',
    'اتصل أو راسل شخصاً تثق به الآن فقط لتشتيت اللحظة، دون أن تشرح التفاصيل إن لم ترغب.',
    'اغسل وجهك بماء بارد، وغيّر المكان الذي أنت فيه فوراً.',
  ];
  const en = [
    'Try this now: stand up, slowly drink a cold glass of water, then walk 20 steps while counting your breaths. Urges are waves that peak then fade within minutes.',
    'Open the Quran or listen to a short passage now, and say istighfar out loud 10 times.',
    'Call or message someone you trust right now just to break the moment — no need to explain details.',
    'Splash cold water on your face, and change the room you are in right now.',
  ];
  const list = lang === 'ar' ? ar : en;
  return list[Math.floor(Math.random() * list.length)];
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
    ? 'تمام. اضغط زر "أشعر برغبة الآن" في الرئيسية وسأرافقك خطوة بخطوة لتسجيل ما تشعر به الآن.'
    : 'Got it. Tap "I feel an urge now" on the home screen and I will walk you through logging what you feel right now.';
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
      return { text: exerciseReply(ctx.lang) };
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
  urge: ['رغبة', 'أريد', 'اريد', 'مغري', 'مغربة', 'ضعيف'],
  sad: ['حزين', 'زعلان', 'مكتئب', 'تعبان', 'وحيد'],
  relapsed: ['انتكست', 'سقطت', 'فشلت', 'استسلمت'],
  thanks: ['شكرا', 'شكراً', 'يعطيك العافية'],
  greeting: ['السلام', 'مرحبا', 'اهلا', 'أهلا'],
};

const EN_KEYWORDS = {
  urge: ['urge', 'want to', 'tempted', 'craving', 'weak'],
  sad: ['sad', 'depressed', 'tired', 'lonely', 'down'],
  relapsed: ['relapsed', 'failed', 'gave in', 'i slipped'],
  thanks: ['thanks', 'thank you'],
  greeting: ['hello', 'hi', 'salam'],
};

export function respondToFreeText(text: string, ctx: AssistantContext): AssistantReply {
  const { lang } = ctx;
  const lower = text.toLowerCase();
  const kw = lang === 'ar' ? AR_KEYWORDS : EN_KEYWORDS;

  const matches = (arr: string[]) => arr.some((k) => lower.includes(k.toLowerCase()));

  if (matches(kw.urge)) {
    return {
      text:
        lang === 'ar'
          ? `أشعر أنك في لحظة صعبة الآن. لقد قاومت من قبل ${ctx.resistedCount} مرة، وأنت قادر على تكرار ذلك. اضغط "أشعر برغبة الآن" في الرئيسية لتبدأ عدّاد المقاومة وأرافقك فيه لحظة بلحظة.`
          : `Sounds like you're in a hard moment right now. You've already resisted ${ctx.resistedCount} times before, and you can do it again. Tap "I feel an urge now" on Home to start the fight timer and I'll stay with you through it.`,
    };
  }
  if (matches(kw.relapsed)) {
    return {
      text:
        lang === 'ar'
          ? 'لا بأس أبداً. الانتكاس ليس نهاية الطريق، بل جزء مسجَّل من رحلتك الكاملة. العداد سيبدأ من جديد، لكن كل ما مررت به محفوظ ولن يضيع. هل تريد أن نتحدث عمّا حدث؟'
          : "It's truly okay. A relapse isn't the end of the road — it's a recorded part of your whole journey. The counter resets, but nothing you went through is lost. Want to talk about what happened?",
    };
  }
  if (matches(kw.sad)) {
    return {
      text:
        lang === 'ar'
          ? 'مشاعر الحزن والتعب من أكثر ما يدفع للعادة. جرّب أن تكتب في المفكرة ما تشعر به الآن، أو اطلب مني "تمرين تنفس" لنهدأ سوياً.'
          : 'Sadness and fatigue are among the strongest triggers. Try writing down what you feel right now, or ask me for a "breathing session" so we can calm down together.',
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
        ? 'أنا هنا لأساعدك. يمكنك أن تسألني عن إحصائياتك، أو تطلب تمرين تهدئة، أو تدبّر آية، أو ببساطة تكتب ما يجول بخاطرك.'
        : "I'm here to help. Ask me about your stats, request a calming exercise, a verse to reflect on, or simply write what's on your mind.",
  };
}
