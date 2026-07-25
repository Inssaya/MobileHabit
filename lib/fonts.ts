import {
  useFonts,
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
} from '@expo-google-fonts/tajawal';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';

export const Fonts = {
  body: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  black: 'Tajawal_800ExtraBold',
  quran: 'AmiriQuran_400Regular',
  versePlain: 'Amiri_400Regular',
  verseBold: 'Amiri_700Bold',
} as const;

export function useAppFonts() {
  const [loaded, error] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Amiri_400Regular,
    Amiri_700Bold,
    AmiriQuran_400Regular,
  });
  return { loaded, error };
}
