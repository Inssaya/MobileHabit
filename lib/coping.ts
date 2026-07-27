import type { Lang } from './i18n';

export interface CopingExercise {
  icon: string;
  ar: string;
  en: string;
}

/** Works for any habit — physiological state change, not habit-specific. */
const UNIVERSAL: CopingExercise[] = [
  {
    icon: '🧊',
    ar: 'اغسل وجهك بماء بارد جداً لمدة 30 ثانية. الصدمة الباردة تخفض التوتر فوراً.',
    en: 'Splash very cold water on your face for 30 seconds. The cold shock drops arousal fast.',
  },
  {
    icon: '🚶',
    ar: 'غادر الغرفة التي أنت فيها الآن وامشِ 100 خطوة. المكان جزء من المحفّز.',
    en: 'Leave the room you’re in and walk 100 steps. The place itself is part of the trigger.',
  },
  {
    icon: '🫁',
    ar: 'تنفّس 4-7-8: شهيق 4، حبس 7، زفير 8. كرّرها 4 مرات.',
    en: 'Breathe 4-7-8: in for 4, hold 7, out for 8. Repeat four times.',
  },
  {
    icon: '📿',
    ar: 'ردّد الاستغفار بصوت مسموع 20 مرة، وركّز على المعنى لا العدد.',
    en: 'Say istighfar out loud 20 times, focusing on the meaning rather than the count.',
  },
  {
    icon: '💬',
    ar: 'راسل شخصاً تثق به بأي كلمة. كسر العزلة يكسر الرغبة.',
    en: 'Message someone you trust, any words at all. Breaking isolation breaks the urge.',
  },
  {
    icon: '⏱️',
    ar: 'اتفق مع نفسك على تأجيل 15 دقيقة فقط. أغلب الرغبات لا تنجو من هذا التأجيل.',
    en: 'Agree to delay just 15 minutes. Most urges don’t survive the delay.',
  },
];

const BY_HABIT: Record<string, CopingExercise[]> = {
  masturbation: [
    {
      icon: '📵',
      ar: 'ضع الهاتف خارج الغرفة الآن، وشغّل الضوء بالكامل. الخلوة والظلام هما الشرطان المعتادان.',
      en: 'Put the phone outside the room now and turn all the lights on. Privacy and darkness are the usual conditions.',
    },
    {
      icon: '🚿',
      ar: 'خذ دشاً بارداً أو توضأ. تغيير حالة الجسد يقطع الحلقة.',
      en: 'Take a cold shower or make wudu. Changing your body’s state breaks the loop.',
    },
    {
      icon: '👥',
      ar: 'اخرج إلى مكان فيه أشخاص، ولو غرفة المعيشة. الوجود بين الناس يُنهي الرغبة سريعاً.',
      en: 'Go where other people are, even the living room. Being around others ends it quickly.',
    },
    {
      icon: '🏋️',
      ar: 'مارس تمريناً شاقاً حتى تتعب: 30 تمرين ضغط أو قرفصاء متتالية.',
      en: 'Do something physically hard until you tire: 30 push-ups or squats straight through.',
    },
  ],
  smoking: [
    {
      icon: '💧',
      ar: 'اشرب كوب ماء كامل ببطء. الرغبة في السيجارة تدوم 3-5 دقائق فقط.',
      en: 'Slowly drink a full glass of water. A cigarette craving only lasts 3-5 minutes.',
    },
    {
      icon: '🥕',
      ar: 'امضغ شيئاً مقرمشاً: جزر، تفاح، علكة. يدك وفمك يحتاجان بديلاً.',
      en: 'Chew something crunchy: carrot, apple, gum. Your hand and mouth need a substitute.',
    },
    {
      icon: '🌬️',
      ar: 'خذ 10 أنفاس عميقة بطيئة — نفس حركة التدخين بدون الدخان.',
      en: 'Take 10 slow deep breaths — the same motion as smoking, without the smoke.',
    },
    {
      icon: '🧭',
      ar: 'تجنّب المكان الذي تدخّن فيه عادة لمدة ساعة. الارتباط المكاني قوي جداً.',
      en: 'Avoid your usual smoking spot for an hour. The place-association is very strong.',
    },
  ],
  social_media: [
    {
      icon: '📴',
      ar: 'فعّل وضع الطيران 30 دقيقة، وضع الهاتف في غرفة أخرى.',
      en: 'Turn on airplane mode for 30 minutes and put the phone in another room.',
    },
    {
      icon: '📖',
      ar: 'اقرأ صفحتين من كتاب ورقي. عقلك يحتاج تحفيزاً أبطأ لا أسرع.',
      en: 'Read two pages of a paper book. Your brain needs slower stimulation, not faster.',
    },
    {
      icon: '✍️',
      ar: 'اكتب ما كنت تهرب منه بالتصفح. غالباً ليس التطبيق هو المشكلة.',
      en: 'Write down what you were scrolling to avoid. The app is usually not the real problem.',
    },
  ],
  gaming: [
    {
      icon: '🔌',
      ar: 'افصل الجهاز من الكهرباء وضع يد التحكم في درج مغلق.',
      en: 'Unplug the console and put the controller in a closed drawer.',
    },
    {
      icon: '⏲️',
      ar: 'حدد مهمة واقعية مدتها 25 دقيقة، وأنجزها قبل أي شيء آخر.',
      en: 'Set one real-life task for 25 minutes and finish it before anything else.',
    },
    {
      icon: '🎯',
      ar: 'اسأل نفسك: هل ألعب لأستمتع أم لأهرب؟ الإجابة تغيّر القرار.',
      en: 'Ask yourself: am I playing to enjoy, or to escape? The answer changes the decision.',
    },
  ],
  junk_food: [
    {
      icon: '🥤',
      ar: 'اشرب كوبي ماء وانتظر 10 دقائق. العطش يُخلط كثيراً مع الجوع.',
      en: 'Drink two glasses of water and wait 10 minutes. Thirst is often mistaken for hunger.',
    },
    {
      icon: '🍎',
      ar: 'كل شيئاً حقيقياً أولاً: بيض، فاكهة، مكسرات. الشراهة تتغذى على الجوع الحقيقي.',
      en: 'Eat something real first: eggs, fruit, nuts. Bingeing feeds on genuine hunger.',
    },
    {
      icon: '🦷',
      ar: 'اغسل أسنانك الآن. طعم المعجون يقتل الرغبة في الأكل.',
      en: 'Brush your teeth now. The toothpaste taste kills the urge to eat.',
    },
  ],
  alcohol: [
    {
      icon: '🧃',
      ar: 'حضّر مشروباً بديلاً بطقوس مشابهة: كوب، ثلج، ليمون.',
      en: 'Make a substitute drink with the same ritual: glass, ice, lemon.',
    },
    {
      icon: '🚪',
      ar: 'ابتعد عن المكان الذي فيه الكحول الآن، ولو لنصف ساعة.',
      en: 'Get away from wherever the alcohol is, even for half an hour.',
    },
  ],
  gambling: [
    {
      icon: '🔒',
      ar: 'أغلق التطبيق واحذف بيانات الدفع المحفوظة الآن، وليس لاحقاً.',
      en: 'Close the app and delete saved payment details now, not later.',
    },
    {
      icon: '🧮',
      ar: 'اكتب المبلغ الحقيقي الذي خسرته حتى اليوم. الرقم أصدق من الشعور.',
      en: 'Write down the real amount you’ve lost so far. The number is more honest than the feeling.',
    },
  ],
  anger: [
    {
      icon: '🤐',
      ar: 'لا تتكلم لمدة دقيقتين كاملتين. أغلب الندم يحدث في أول دقيقة.',
      en: 'Don’t speak for two full minutes. Most regret happens in the first minute.',
    },
    {
      icon: '🏃',
      ar: 'أخرج الطاقة جسدياً: امشِ بسرعة أو اصعد الدرج.',
      en: 'Discharge it physically: walk fast or take the stairs.',
    },
  ],
};

export function copingFor(habitKey: string | undefined, lang: Lang): CopingExercise & { text: string } {
  const pool = [...(habitKey ? BY_HABIT[habitKey] ?? [] : []), ...UNIVERSAL];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { ...picked, text: lang === 'ar' ? picked.ar : picked.en };
}

export function allCopingFor(habitKey: string | undefined, lang: Lang): (CopingExercise & { text: string })[] {
  const pool = [...(habitKey ? BY_HABIT[habitKey] ?? [] : []), ...UNIVERSAL];
  return pool.map((p) => ({ ...p, text: lang === 'ar' ? p.ar : p.en }));
}

export interface CrisisResource {
  ar: string;
  en: string;
}

/**
 * Deliberately generic: this app ships to many countries and hard-coding a
 * single hotline would be wrong for most users. Point them to a directory
 * plus their local emergency number.
 */
export const CRISIS_NOTE: CrisisResource = {
  ar: 'إذا وصلت إلى أفكار إيذاء النفس أو شعرت أن الأمر أكبر منك، فهذا ليس ضعفاً ولا فشلاً في رحلتك. تواصل مع شخص تثق به الآن، أو مع مختص نفسي، أو مع رقم الطوارئ في بلدك. يمكنك أيضاً إيجاد خطوط الدعم النفسي حسب دولتك عبر findahelpline.com',
  en: 'If you reach thoughts of harming yourself, or it feels bigger than you can carry, that is not weakness and not a failure of your journey. Reach out to someone you trust, a mental health professional, or your local emergency number. You can also find a support line for your country at findahelpline.com',
};
