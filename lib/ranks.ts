export interface Rank {
  key: string;
  nameAr: string;
  nameEn: string;
  minDays: number;
  icon: string;
  colorFrom: string;
  colorTo: string;
  taglineAr: string;
  taglineEn: string;
}

export const RANKS: Rank[] = [
  {
    key: 'faashil',
    nameAr: 'فاشل',
    nameEn: 'The Fallen',
    minDays: 0,
    icon: '🌑',
    colorFrom: '#5C6890',
    colorTo: '#3A4568',
    taglineAr: 'كل الأبطال بدأوا من هنا. اليوم هو يومك الأول، لا آخر.',
    taglineEn: 'Every hero started here. Today is day one, not the end.',
  },
  {
    key: 'muqawim',
    nameAr: 'مقاوم',
    nameEn: 'Resister',
    minDays: 1,
    icon: '🔥',
    colorFrom: '#E67E5B',
    colorTo: '#C85C3C',
    taglineAr: 'قاومت أول يوم. هذا أصعب خطوة وقد فعلتها.',
    taglineEn: 'You resisted day one — the hardest step is behind you.',
  },
  {
    key: 'mutamassik',
    nameAr: 'متمسك',
    nameEn: 'Steadfast',
    minDays: 3,
    icon: '🌿',
    colorFrom: '#3FC896',
    colorTo: '#25A379',
    taglineAr: 'تمسكت رغم الرغبة. الثبات يُبنى يوماً بعد يوم.',
    taglineEn: 'You held on despite the urge. Steadiness is built day by day.',
  },
  {
    key: 'muthabir',
    nameAr: 'مثابر',
    nameEn: 'Persistent',
    minDays: 7,
    icon: '🌱',
    colorFrom: '#2FD3C7',
    colorTo: '#1CA69D',
    taglineAr: 'أسبوع كامل! المثابرة بدأت تتحول إلى عادة جديدة.',
    taglineEn: 'A full week! Persistence is turning into a new habit.',
  },
  {
    key: 'sabir',
    nameAr: 'صابر',
    nameEn: 'Patient',
    minDays: 14,
    icon: '🕊️',
    colorFrom: '#4FA3E3',
    colorTo: '#2E7FC1',
    taglineAr: 'الصبر مفتاح الفرج. أنت الآن مثال حي على ذلك.',
    taglineEn: 'Patience is the key to relief — you are living proof.',
  },
  {
    key: 'mutahakkim',
    nameAr: 'متحكم',
    nameEn: 'In Control',
    minDays: 21,
    icon: '🛡️',
    colorFrom: '#8B7CF6',
    colorTo: '#6753D6',
    taglineAr: 'ثلاثة أسابيع من التحكم الحقيقي. القرار أصبح بيدك.',
    taglineEn: 'Three weeks of real control. The decision is truly yours now.',
  },
  {
    key: 'hakim',
    nameAr: 'حكيم',
    nameEn: 'The Wise',
    minDays: 45,
    icon: '📿',
    colorFrom: '#F2C572',
    colorTo: '#D6A13F',
    taglineAr: 'الحكمة أن تعرف عدوك وتهزمه بصبر. أنت هناك الآن.',
    taglineEn: 'Wisdom is knowing your enemy and patiently defeating it. You are there.',
  },
  {
    key: 'sayyid_nafs',
    nameAr: 'سيد نفسه',
    nameEn: 'Master of Self',
    minDays: 90,
    icon: '👑',
    colorFrom: '#F2C572',
    colorTo: '#E7893F',
    taglineAr: 'من ملك نفسه ملك أعظم ملك. أنت سيد قرارك الآن.',
    taglineEn: 'Whoever masters himself owns the greatest kingdom.',
  },
  {
    key: 'usturah',
    nameAr: 'أسطورة',
    nameEn: 'Legend',
    minDays: 180,
    icon: '⭐',
    colorFrom: '#FFFFFF',
    colorTo: '#F2C572',
    taglineAr: 'نصف عام كامل. قصتك الآن أصبحت أسطورة لغيرك.',
    taglineEn: 'A full half year. Your story is now a legend for others.',
  },
];

export function rankForDays(days: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (days >= r.minDays) current = r;
  }
  return current;
}

export function nextRank(days: number): Rank | null {
  const idx = RANKS.findIndex((r) => r.key === rankForDays(days).key);
  return idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function rankProgress(days: number): number {
  const cur = rankForDays(days);
  const next = nextRank(days);
  if (!next) return 1;
  const span = next.minDays - cur.minDays;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (days - cur.minDays) / span));
}
