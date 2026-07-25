export interface HabitGuess {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

interface Rule {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  keywords: string[];
}

const RULES: Rule[] = [
  {
    key: 'masturbation',
    nameAr: 'العادة السرية',
    nameEn: 'Pornography / Masturbation',
    icon: '🚫',
    keywords: ['استمناء', 'العادة السرية', 'اباح', 'إباحي', 'افلام اباحية', 'porn', 'masturbat', 'pmo', 'nofap'],
  },
  {
    key: 'smoking',
    nameAr: 'التدخين',
    nameEn: 'Smoking',
    icon: '🚬',
    keywords: ['دخان', 'سجائر', 'سيجارة', 'تدخين', 'smok', 'cigaret', 'vape', 'نيكوتين'],
  },
  {
    key: 'alcohol',
    nameAr: 'الكحول',
    nameEn: 'Alcohol',
    icon: '🍷',
    keywords: ['كحول', 'خمر', 'شرب', 'alcohol', 'drink', 'beer', 'wine'],
  },
  {
    key: 'social_media',
    nameAr: 'الإدمان على السوشيال ميديا',
    nameEn: 'Social Media Addiction',
    icon: '📱',
    keywords: ['سوشيال', 'تواصل الاجتماعي', 'تيك توك', 'انستقرام', 'يوتيوب', 'social media', 'tiktok', 'instagram', 'youtube', 'scroll', 'سكرول'],
  },
  {
    key: 'gaming',
    nameAr: 'إدمان الألعاب',
    nameEn: 'Gaming Addiction',
    icon: '🎮',
    keywords: ['العاب', 'ألعاب', 'قيمنق', 'gaming', 'game addiction', 'video games'],
  },
  {
    key: 'junk_food',
    nameAr: 'الأكل العشوائي',
    nameEn: 'Junk / Binge Eating',
    icon: '🍔',
    keywords: ['اكل', 'طعام', 'شراهة', 'وزن', 'junk food', 'binge', 'overeat', 'sugar', 'سكر'],
  },
  {
    key: 'gambling',
    nameAr: 'المقامرة',
    nameEn: 'Gambling',
    icon: '🎲',
    keywords: ['مقامرة', 'قمار', 'رهان', 'gambl', 'bet', 'casino'],
  },
  {
    key: 'lying',
    nameAr: 'الكذب',
    nameEn: 'Lying',
    icon: '🤥',
    keywords: ['كذب', 'lying', 'lie'],
  },
  {
    key: 'anger',
    nameAr: 'الغضب والانفعال',
    nameEn: 'Anger Outbursts',
    icon: '💢',
    keywords: ['غضب', 'انفعال', 'صراخ', 'anger', 'temper', 'rage'],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

export function guessHabit(freeText: string): HabitGuess {
  const normalized = normalize(freeText);
  let best: Rule | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (normalized.includes(normalize(kw))) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  if (best) {
    return { key: best.key, nameAr: best.nameAr, nameEn: best.nameEn, icon: best.icon };
  }

  const trimmed = freeText.trim();
  const words = trimmed.split(/\s+/).slice(0, 4).join(' ');
  const fallbackName = words.length > 0 ? words : 'عادتي';
  return {
    key: 'custom',
    nameAr: fallbackName,
    nameEn: fallbackName,
    icon: '🎯',
  };
}
