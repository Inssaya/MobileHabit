import type { AppState } from './types';

export interface Milestone {
  key: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  /** Returns true once the user has earned this milestone. */
  earned: (s: MilestoneInput) => boolean;
}

export interface MilestoneInput {
  currentStreakDays: number;
  bestStreakDays: number;
  resistedCount: number;
  relapseCount: number;
  totalUrges: number;
  checkInCount: number;
  journeyDays: number;
}

export const MILESTONES: Milestone[] = [
  {
    key: 'first_day',
    icon: '🌅',
    titleAr: 'أول 24 ساعة',
    titleEn: 'First 24 hours',
    bodyAr: 'أصعب يوم في أي رحلة هو أولها، وقد تجاوزته.',
    bodyEn: 'The hardest day of any journey is the first, and you got past it.',
    earned: (s) => s.currentStreakDays >= 1,
  },
  {
    key: 'first_resist',
    icon: '🛡️',
    titleAr: 'أول انتصار',
    titleEn: 'First victory',
    bodyAr: 'قاومت رغبة كاملة حتى انتهت. الآن تعرف أنك تستطيع.',
    bodyEn: 'You rode out a full urge until it passed. Now you know you can.',
    earned: (s) => s.resistedCount >= 1,
  },
  {
    key: 'three_days',
    icon: '🌿',
    titleAr: '3 أيام',
    titleEn: '3 days',
    bodyAr: 'ثلاثة أيام كاملة. جسدك بدأ يعتاد الوضع الجديد.',
    bodyEn: 'Three full days. Your body is starting to adjust to the new normal.',
    earned: (s) => s.currentStreakDays >= 3,
  },
  {
    key: 'week',
    icon: '🌱',
    titleAr: 'أسبوع كامل',
    titleEn: 'A full week',
    bodyAr: 'أسبوع! هذه ليست صدفة، هذا نمط جديد تبنيه.',
    bodyEn: 'A week! This isn’t luck any more — it’s a pattern you’re building.',
    earned: (s) => s.currentStreakDays >= 7,
  },
  {
    key: 'five_resists',
    icon: '⚔️',
    titleAr: '5 رغبات مقاومة',
    titleEn: '5 urges resisted',
    bodyAr: 'خمس معارك ربحتها. كل واحدة أضعفت العادة أكثر.',
    bodyEn: 'Five battles won. Each one made the habit weaker.',
    earned: (s) => s.resistedCount >= 5,
  },
  {
    key: 'two_weeks',
    icon: '🕊️',
    titleAr: 'أسبوعان',
    titleEn: 'Two weeks',
    bodyAr: 'أسبوعان من الصبر. الرغبات تصبح أقصر وأضعف من هنا.',
    bodyEn: 'Two weeks of patience. Urges get shorter and weaker from here.',
    earned: (s) => s.currentStreakDays >= 14,
  },
  {
    key: 'month',
    icon: '🏔️',
    titleAr: 'شهر كامل',
    titleEn: 'A full month',
    bodyAr: 'ثلاثون يوماً. أنت الآن شخص مختلف عمّن بدأ.',
    bodyEn: 'Thirty days. You are a different person from the one who started.',
    earned: (s) => s.currentStreakDays >= 30,
  },
  {
    key: 'twenty_resists',
    icon: '🔱',
    titleAr: '20 رغبة مقاومة',
    titleEn: '20 urges resisted',
    bodyAr: 'عشرون مرة اخترت فيها نفسك. هذه ليست إرادة عابرة.',
    bodyEn: 'Twenty times you chose yourself. That isn’t passing willpower.',
    earned: (s) => s.resistedCount >= 20,
  },
  {
    key: 'ninety',
    icon: '👑',
    titleAr: '90 يوماً',
    titleEn: '90 days',
    bodyAr: 'تسعون يوماً — العتبة التي يتحدث عنها الجميع. عبرتها.',
    bodyEn: 'Ninety days — the threshold everyone talks about. You crossed it.',
    earned: (s) => s.currentStreakDays >= 90,
  },
  {
    key: 'honest_logger',
    icon: '📓',
    titleAr: 'صادق مع نفسك',
    titleEn: 'Honest with yourself',
    bodyAr: 'سجّلت 10 لحظات بصدق، بما فيها الصعبة. هذا وحده تقدّم.',
    bodyEn: 'You logged 10 moments honestly, including the hard ones. That alone is progress.',
    earned: (s) => s.totalUrges >= 10,
  },
  {
    key: 'consistent',
    icon: '📅',
    titleAr: 'حضور يومي',
    titleEn: 'Showing up',
    bodyAr: 'سجّلت حضورك 7 أيام. الاستمرار أهم من الكمال.',
    bodyEn: 'You checked in 7 days. Consistency beats perfection.',
    earned: (s) => s.checkInCount >= 7,
  },
  {
    key: 'came_back',
    icon: '🔄',
    titleAr: 'عدت من جديد',
    titleEn: 'You came back',
    bodyAr: 'انتكست وعدت. العودة بعد السقوط هي المهارة الحقيقية.',
    bodyEn: 'You relapsed and came back. Returning after a fall is the real skill.',
    earned: (s) => s.relapseCount >= 1 && s.currentStreakDays >= 1,
  },
];

export function milestoneByKey(key: string): Milestone | undefined {
  return MILESTONES.find((m) => m.key === key);
}

/** Returns milestone keys newly earned that aren't already unlocked. */
export function newlyEarned(input: MilestoneInput, alreadyUnlocked: string[]): string[] {
  return MILESTONES.filter((m) => !alreadyUnlocked.includes(m.key) && m.earned(input)).map((m) => m.key);
}

export function milestoneInputFromState(
  s: Pick<AppState, 'bestStreakDays' | 'resistedCount' | 'relapseCount' | 'urges' | 'checkIns' | 'journeyStartedAt'>,
  currentStreakDays: number
): MilestoneInput {
  const journeyDays = s.journeyStartedAt ? (Date.now() - s.journeyStartedAt) / 86400000 : 0;
  return {
    currentStreakDays,
    bestStreakDays: s.bestStreakDays,
    resistedCount: s.resistedCount,
    relapseCount: s.relapseCount,
    totalUrges: s.urges.length,
    checkInCount: s.checkIns.length,
    journeyDays,
  };
}
