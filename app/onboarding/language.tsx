import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import StepDots from '../../components/StepDots';
import { PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import type { Lang } from '../../lib/i18n';

const OPTIONS: { code: Lang; label: string; sub: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', sub: 'Arabic', flag: '🇸🇦' },
  { code: 'en', label: 'English', sub: 'الإنجليزية', flag: '🇬🇧' },
];

export default function LanguageScreen() {
  const theme = useTheme();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const t = useT('onboarding');
  const tc = useT('common');

  return (
    <Screen style={styles.screen}>
      <View style={styles.top}>
        <StepDots total={4} current={0} />
        <Text style={[styles.title, { color: theme.text }]}>{t('langTitle')}</Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>{t('langSub')}</Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((opt) => {
          const selected = lang === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              activeOpacity={0.8}
              onPress={() => setLang(opt.code)}
              style={[
                styles.option,
                {
                  backgroundColor: theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                  borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={styles.flag}>{opt.flag}</Text>
              <View>
                <Text style={[styles.optLabel, { color: theme.text }]}>{opt.label}</Text>
                <Text style={[styles.optSub, { color: theme.textDim }]}>{opt.sub}</Text>
              </View>
              {selected ? <Text style={[styles.check, { color: theme.primary }]}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <PrimaryButton label={tc('continue')} onPress={() => router.push('/onboarding/theme')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingTop: 20, justifyContent: 'space-between', paddingBottom: 24 },
  top: { gap: 14, alignItems: 'center', marginTop: 12 },
  title: { fontFamily: Fonts.black, fontSize: 26, textAlign: 'center', marginTop: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  options: { gap: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 20,
  },
  flag: { fontSize: 28 },
  optLabel: { fontFamily: Fonts.bold, fontSize: 18 },
  optSub: { fontFamily: Fonts.body, fontSize: 12, marginTop: 2 },
  check: { marginStart: 'auto', fontSize: 20, fontFamily: Fonts.black },
});
