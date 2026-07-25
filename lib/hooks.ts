import { useCallback, useMemo } from 'react';

import { useAppStore } from './store';
import { THEMES } from './theme';
import { translate, type NamespaceKey } from './i18n';

export function useTheme() {
  const themeId = useAppStore((s) => s.theme);
  return THEMES[themeId];
}

export function useLang() {
  return useAppStore((s) => s.lang);
}

export function useIsRTL() {
  const lang = useLang();
  return lang === 'ar';
}

export function useT(ns: NamespaceKey) {
  const lang = useLang();
  return useCallback((key: string) => translate(lang, ns, key), [lang, ns]);
}

export function useRankLabel() {
  const lang = useLang();
  return useMemo(() => (lang === 'ar' ? { rank: 'الرتبة', next: 'الرتبة القادمة' } : { rank: 'Rank', next: 'Next rank' }), [lang]);
}
