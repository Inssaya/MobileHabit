export type ThemeId = 'noor' | 'sakina' | 'fajr';

export interface AppTheme {
  id: ThemeId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  dark: boolean;
  bg: string;
  bgTop: string;
  bgBottom: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  text: string;
  textDim: string;
  textFaint: string;
  success: string;
  danger: string;
  warning: string;
  glow: string;
  gradient: [string, string, ...string[]];
}

export const THEMES: Record<ThemeId, AppTheme> = {
  noor: {
    id: 'noor',
    nameAr: 'نور الليل',
    nameEn: 'Midnight Noor',
    descAr: 'داكن ومتوهج بالذهبي والفيروزي',
    descEn: 'Dark, glowing gold & teal',
    dark: true,
    bg: '#060B18',
    bgTop: '#0A1330',
    bgBottom: '#03060F',
    surface: '#101B36',
    surfaceAlt: '#16223F',
    border: '#233257',
    primary: '#2FD3C7',
    primarySoft: 'rgba(47,211,199,0.16)',
    accent: '#F2C572',
    accentSoft: 'rgba(242,197,114,0.16)',
    text: '#F4F7FF',
    textDim: '#9AA9CC',
    textFaint: '#5C6890',
    success: '#3ED598',
    danger: '#FF6B6B',
    warning: '#F2C572',
    glow: 'rgba(47,211,199,0.55)',
    gradient: ['#0A1330', '#111E42', '#060B18'],
  },
  sakina: {
    id: 'sakina',
    nameAr: 'سكينة',
    nameEn: 'Sakina (Calm)',
    descAr: 'أخضر زمردي هادئ بلمسة ذهبية',
    descEn: 'Calm emerald green & soft gold',
    dark: true,
    bg: '#071411',
    bgTop: '#0B211C',
    bgBottom: '#040C0A',
    surface: '#0F2620',
    surfaceAlt: '#153229',
    border: '#20402F',
    primary: '#3FC896',
    primarySoft: 'rgba(63,200,150,0.16)',
    accent: '#E7C989',
    accentSoft: 'rgba(231,201,137,0.16)',
    text: '#F1F8F3',
    textDim: '#9BC1AC',
    textFaint: '#5A7C6C',
    success: '#4ADE80',
    danger: '#F87171',
    warning: '#E7C989',
    glow: 'rgba(63,200,150,0.5)',
    gradient: ['#0B211C', '#123328', '#071411'],
  },
  fajr: {
    id: 'fajr',
    nameAr: 'فجر',
    nameEn: 'Fajr (Dawn Light)',
    descAr: 'فاتح ودافئ برملي وتركوازي عميق',
    descEn: 'Light, warm sand & deep teal',
    dark: false,
    bg: '#FBF6ED',
    bgTop: '#FDF9F0',
    bgBottom: '#F3E9D6',
    surface: '#FFFFFF',
    surfaceAlt: '#F6EFE0',
    border: '#E7DAC0',
    primary: '#0F7C73',
    primarySoft: 'rgba(15,124,115,0.10)',
    accent: '#C08A34',
    accentSoft: 'rgba(192,138,52,0.14)',
    text: '#1E2A2A',
    textDim: '#5B6B66',
    textFaint: '#93A29C',
    success: '#1F9D63',
    danger: '#D6473C',
    warning: '#C08A34',
    glow: 'rgba(15,124,115,0.28)',
    gradient: ['#FDF9F0', '#F3E9D6', '#EFE1C4'],
  },
};

export const THEME_ORDER: ThemeId[] = ['noor', 'sakina', 'fajr'];
