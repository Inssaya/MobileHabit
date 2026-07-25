import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import RankBadge from '../../components/RankBadge';
import { PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT, useLang } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { RANKS } from '../../lib/ranks';

export default function WelcomeScreen() {
  const theme = useTheme();
  const t = useT('onboarding');
  const lang = useLang();
  const habit = useAppStore((s) => s.habit);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const start = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.center}>
        <RankBadge rank={RANKS[0]} size="large" />
        <Text style={[styles.habit, { color: theme.accent }]}>
          {habit ? (lang === 'ar' ? habit.nameAr : habit.nameEn) : ''}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>{t('welcomeTitle')}</Text>
        <Text style={[styles.body, { color: theme.textDim }]}>{t('welcomeBody')}</Text>
      </View>

      <PrimaryButton label={t('startJourney')} onPress={start} icon="🔥" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  habit: { fontFamily: Fonts.bold, fontSize: 15 },
  title: { fontFamily: Fonts.black, fontSize: 26, textAlign: 'center', marginTop: 6 },
  body: { fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
});
