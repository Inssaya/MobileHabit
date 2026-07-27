import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import Screen from '../../components/Screen';
import StepDots from '../../components/StepDots';
import { PrimaryButton, GhostButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT, useLang } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { THEMES, THEME_ORDER } from '../../lib/theme';

export default function ThemeScreen() {
  const theme = useTheme();
  const themeId = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const t = useT('onboarding');
  const tc = useT('common');
  const lang = useLang();

  return (
    <Screen style={styles.screen}>
      <View style={styles.top}>
        <StepDots total={5} current={1} />
        <Text style={[styles.title, { color: theme.text }]}>{t('themeTitle')}</Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>{t('themeSub')}</Text>
      </View>

      <View style={styles.options}>
        {THEME_ORDER.map((id) => {
          const th = THEMES[id];
          const selected = themeId === id;
          return (
            <TouchableOpacity key={id} activeOpacity={0.85} onPress={() => setTheme(id)}>
              <LinearGradient
                colors={th.gradient}
                style={[
                  styles.option,
                  { borderColor: selected ? th.primary : th.border, borderWidth: selected ? 2 : StyleSheet.hairlineWidth },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: th.primary }]} />
                <View style={[styles.swatch, { backgroundColor: th.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: th.text }]}>{lang === 'ar' ? th.nameAr : th.nameEn}</Text>
                  <Text style={[styles.desc, { color: th.textDim }]}>{lang === 'ar' ? th.descAr : th.descEn}</Text>
                </View>
                {selected ? <Text style={{ color: th.primary, fontSize: 20, fontFamily: Fonts.black }}>✓</Text> : null}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ gap: 12 }}>
        <PrimaryButton label={tc('continue')} onPress={() => router.push('/onboarding/habit')} />
        <GhostButton label={tc('back')} onPress={() => router.back()} />
      </View>
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
    gap: 12,
    padding: 18,
    borderRadius: 20,
  },
  swatch: { width: 20, height: 20, borderRadius: 10 },
  name: { fontFamily: Fonts.bold, fontSize: 17 },
  desc: { fontFamily: Fonts.body, fontSize: 12, marginTop: 2 },
});
