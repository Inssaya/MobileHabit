import type { TriggerKey } from './types';

export interface TriggerDef {
  key: TriggerKey;
  icon: string;
  labelAr: string;
  labelEn: string;
  /** Short, concrete counter-move for this specific state. */
  tipAr: string;
  tipEn: string;
}

// HALT (Hungry / Angry / Lonely / Tired) plus the states that most often
// precede an urge. Quick-tap tags matter because typing is the last thing
// someone wants to do mid-craving.
export const TRIGGERS: TriggerDef[] = [
  {
    key: 'hungry',
    icon: '🍽️',
    labelAr: 'جائع',
    labelEn: 'Hungry',
    tipAr: 'كل شيئاً حقيقياً الآن قبل أي قرار آخر. الجوع يضعف إرادتك فعلياً.',
    tipEn: 'Eat something real before any other decision. Hunger genuinely weakens willpower.',
  },
  {
    key: 'angry',
    icon: '💢',
    labelAr: 'غاضب',
    labelEn: 'Angry',
    tipAr: 'أخرج الغضب حركةً لا عادةً: 20 تمرين ضغط، أو امشِ بسرعة 5 دقائق.',
    tipEn: 'Move the anger out instead of feeding it: 20 push-ups, or walk fast for 5 minutes.',
  },
  {
    key: 'lonely',
    icon: '🫂',
    labelAr: 'وحيد',
    labelEn: 'Lonely',
    tipAr: 'راسل شخصاً واحداً الآن، ولو بكلمة. الوحدة أكبر وقود لهذه العادة.',
    tipEn: 'Message one person right now, even a single word. Loneliness is this habit’s biggest fuel.',
  },
  {
    key: 'tired',
    icon: '😴',
    labelAr: 'متعب',
    labelEn: 'Tired',
    tipAr: 'نم أو استلقِ 20 دقيقة. أغلب الانتكاسات تحدث بعد منتصف الليل من الإرهاق.',
    tipEn: 'Sleep or lie down for 20 minutes. Most relapses happen past midnight, from exhaustion.',
  },
  {
    key: 'bored',
    icon: '🥱',
    labelAr: 'ملل',
    labelEn: 'Bored',
    tipAr: 'الملل يحتاج مهمة لا ترفيهاً. اختر شيئاً يدوياً لمدة 10 دقائق.',
    tipEn: 'Boredom needs a task, not entertainment. Pick something hands-on for 10 minutes.',
  },
  {
    key: 'stressed',
    icon: '😣',
    labelAr: 'ضغط',
    labelEn: 'Stressed',
    tipAr: 'اكتب مصدر الضغط في سطر واحد، ثم تنفّس 4-7-8 أربع مرات.',
    tipEn: 'Write the source of the stress in one line, then breathe 4-7-8 four times.',
  },
  {
    key: 'anxious',
    icon: '😰',
    labelAr: 'قلق',
    labelEn: 'Anxious',
    tipAr: 'جرّب تمرين التأريض: 5 أشياء تراها، 4 تلمسها، 3 تسمعها.',
    tipEn: 'Try grounding: 5 things you can see, 4 you can touch, 3 you can hear.',
  },
  {
    key: 'sad',
    icon: '😔',
    labelAr: 'حزين',
    labelEn: 'Sad',
    tipAr: 'الحزن ليس عيباً. اسمح لنفسك بالشعور به دون أن تهرب منه إلى العادة.',
    tipEn: 'Sadness isn’t a flaw. Let yourself feel it instead of escaping into the habit.',
  },
  {
    key: 'aroused',
    icon: '🔥',
    labelAr: 'إثارة',
    labelEn: 'Aroused',
    tipAr: 'غيّر المكان فوراً وأشغل يديك. الموجة تهبط خلال 10-20 دقيقة.',
    tipEn: 'Change rooms immediately and occupy your hands. The wave drops within 10-20 minutes.',
  },
  {
    key: 'idle',
    icon: '📱',
    labelAr: 'تصفح بلا هدف',
    labelEn: 'Idle scrolling',
    tipAr: 'ضع الهاتف في غرفة أخرى الآن. التصفح العشوائي هو البوابة المعتادة.',
    tipEn: 'Put the phone in another room now. Aimless scrolling is the usual gateway.',
  },
];

export function triggerLabel(key: TriggerKey, lang: 'ar' | 'en'): string {
  const def = TRIGGERS.find((t) => t.key === key);
  if (!def) return key;
  return lang === 'ar' ? def.labelAr : def.labelEn;
}

export function triggerDef(key: TriggerKey): TriggerDef | undefined {
  return TRIGGERS.find((t) => t.key === key);
}
