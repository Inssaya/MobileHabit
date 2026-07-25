export interface Ayah {
  id: string;
  arabic: string;
  reference: string;
  meaningEn: string;
  reflectionAr: string;
  reflectionEn: string;
}

// Short, well-known verses chosen for their theme of patience, self-restraint,
// hope and repentance. `meaningEn` is a plain-language gloss (not a formal
// translation) and `reflection*` is a brief benefit note, not tafsir.
export const AYAT: Ayah[] = [
  {
    id: 'inshirah-6',
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    reference: 'سورة الشرح ٦',
    meaningEn: 'Indeed, with hardship comes ease.',
    reflectionAr: 'مهما طال ألم المقاومة الآن، فالفرج قريب.',
    reflectionEn: 'However long resisting feels right now, relief is close.',
  },
  {
    id: 'naziat-40',
    arabic: 'وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ فَإِنَّ الْجَنَّةَ هِيَ الْمَأْوَىٰ',
    reference: 'سورة النازعات ٤٠-٤١',
    meaningEn: 'But as for one who feared standing before his Lord and restrained the soul from desire — Paradise is the refuge.',
    reflectionAr: 'كل مرة تمنع فيها نفسك عن الهوى، أنت تبني بيتك في الجنة.',
    reflectionEn: 'Every time you hold your soul back from desire, you build your home in Paradise.',
  },
  {
    id: 'baqarah-153',
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    reference: 'سورة البقرة ١٥٣',
    meaningEn: 'Indeed, Allah is with the patient.',
    reflectionAr: 'أنت لست وحدك في هذه اللحظة الصعبة.',
    reflectionEn: 'You are not alone in this hard moment.',
  },
  {
    id: 'baqarah-155',
    arabic: 'وَبَشِّرِ الصَّابِرِينَ',
    reference: 'سورة البقرة ١٥٥',
    meaningEn: 'And give good tidings to the patient.',
    reflectionAr: 'كل دقيقة صبر الآن بشارة خير قادمة إليك.',
    reflectionEn: 'Every minute of patience now is good news arriving for you.',
  },
  {
    id: 'baqarah-45',
    arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    reference: 'سورة البقرة ٤٥',
    meaningEn: 'And seek help through patience and prayer.',
    reflectionAr: 'اجعل الصبر والصلاة سلاحك في هذه اللحظة بالذات.',
    reflectionEn: 'Make patience and prayer your weapon in this exact moment.',
  },
  {
    id: 'zumar-53',
    arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    reference: 'سورة الزمر ٥٣',
    meaningEn: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
    reflectionAr: 'مهما سقطت من قبل، الباب لم يُغلق. حاول من جديد.',
    reflectionEn: 'However many times you fell before, the door is never closed. Try again.',
  },
  {
    id: 'nur-31',
    arabic: 'وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ',
    reference: 'سورة النور ٣١',
    meaningEn: 'And turn to Allah in repentance, all of you believers, that you might succeed.',
    reflectionAr: 'التوبة ليست خطاً نهائياً، بل بداية جديدة تُفتح كل يوم.',
    reflectionEn: 'Repentance is not a finish line — it is a new beginning that opens every day.',
  },
  {
    id: 'yusuf-53',
    arabic: 'إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ إِلَّا مَا رَحِمَ رَبِّي',
    reference: 'سورة يوسف ٥٣',
    meaningEn: 'Indeed, the soul is a persistent enjoiner of evil, except those upon whom my Lord has mercy.',
    reflectionAr: 'اعرف عدوك: نفسك تأمر بالسوء، فقاومها برحمة الله وعونه.',
    reflectionEn: 'Know your enemy: the self commands evil — resist it with God’s mercy and help.',
  },
  {
    id: 'talaq-2-3',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    reference: 'سورة الطلاق ٢',
    meaningEn: 'And whoever fears Allah, He will make for him a way out.',
    reflectionAr: 'هناك دائماً مخرج من هذه العادة، والتقوى هي الطريق إليه.',
    reflectionEn: 'There is always a way out of this habit, and God-consciousness is the road to it.',
  },
  {
    id: 'ankabut-69',
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    reference: 'سورة العنكبوت ٦٩',
    meaningEn: 'And those who strive for Us, We will surely guide them to Our ways.',
    reflectionAr: 'مجاهدة النفس الآن هي عين الطريق إلى الهداية.',
    reflectionEn: 'Struggling against yourself right now is the very path to guidance.',
  },
];

export function randomAyah(excludeId?: string): Ayah {
  const pool = excludeId ? AYAT.filter((a) => a.id !== excludeId) : AYAT;
  return pool[Math.floor(Math.random() * pool.length)];
}
