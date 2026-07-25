import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import StepDots from '../../components/StepDots';
import Card from '../../components/Card';
import { PrimaryButton, GhostButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT, useLang } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { guessHabit } from '../../lib/habitClassifier';

type Phase = 'input' | 'analyzing' | 'result';

export default function HabitScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('onboarding');
  const tc = useT('common');
  const setHabit = useAppStore((s) => s.setHabit);

  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [key, setKey] = useState('custom');

  const analyze = () => {
    if (text.trim().length < 3) return;
    setPhase('analyzing');
    setTimeout(() => {
      const guess = guessHabit(text);
      setIcon(guess.icon);
      setNameAr(guess.nameAr);
      setNameEn(guess.nameEn);
      setKey(guess.key);
      setPhase('result');
    }, 1100);
  };

  const confirm = () => {
    setHabit({
      key,
      nameAr: nameAr.trim() || 'عادتي',
      nameEn: nameEn.trim() || 'My habit',
      icon,
      rawDescription: text.trim(),
      createdAt: Date.now(),
    });
    router.push('/onboarding/pin');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepDots total={4} current={2} />
          <Text style={[styles.title, { color: theme.text }]}>{t('habitTitle')}</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>{t('habitSub')}</Text>

          {phase !== 'result' ? (
            <Card style={{ marginTop: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('habitPlaceholder')}
                placeholderTextColor={theme.textFaint}
                multiline
                textAlign={lang === 'ar' ? 'right' : 'left'}
                style={[styles.input, { color: theme.text, fontFamily: Fonts.body }]}
              />
            </Card>
          ) : (
            <Card style={{ marginTop: 8, alignItems: 'center', gap: 14 }}>
              <Text style={{ fontSize: 44 }}>{icon}</Text>
              <Text style={[styles.detected, { color: theme.primary }]}>{t('habitDetected')}</Text>
              <Text style={[styles.confirmQ, { color: theme.textDim }]}>{t('habitConfirm')}</Text>
              <View style={{ width: '100%' }}>
                <Text style={[styles.label, { color: theme.textDim }]}>{t('habitNameLabel')} (عربي)</Text>
                <TextInput
                  value={nameAr}
                  onChangeText={setNameAr}
                  style={[styles.nameInput, { color: theme.text, borderColor: theme.border, fontFamily: Fonts.medium }]}
                  textAlign="right"
                />
                <Text style={[styles.label, { color: theme.textDim, marginTop: 10 }]}>{t('habitNameLabel')} (English)</Text>
                <TextInput
                  value={nameEn}
                  onChangeText={setNameEn}
                  style={[styles.nameInput, { color: theme.text, borderColor: theme.border, fontFamily: Fonts.medium }]}
                  textAlign="left"
                />
              </View>
            </Card>
          )}

          {phase === 'analyzing' ? (
            <View style={styles.analyzing}>
              <ActivityIndicator color={theme.primary} />
              <Text style={{ color: theme.textDim, fontFamily: Fonts.body, marginTop: 8 }}>{t('habitAnalyzing')}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={{ gap: 12 }}>
          {phase === 'result' ? (
            <PrimaryButton label={tc('continue')} onPress={confirm} />
          ) : (
            <PrimaryButton
              label={tc('continue')}
              disabled={text.trim().length < 3 || phase === 'analyzing'}
              loading={phase === 'analyzing'}
              onPress={analyze}
            />
          )}
          <GhostButton label={tc('back')} onPress={() => router.back()} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, justifyContent: 'space-between' },
  scroll: { gap: 16, alignItems: 'center', paddingBottom: 12 },
  title: { fontFamily: Fonts.black, fontSize: 24, textAlign: 'center', marginTop: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center', paddingHorizontal: 8, lineHeight: 20 },
  input: { minHeight: 140, fontSize: 15, lineHeight: 22 },
  detected: { fontFamily: Fonts.bold, fontSize: 15 },
  confirmQ: { fontFamily: Fonts.body, fontSize: 13 },
  label: { fontFamily: Fonts.body, fontSize: 12 },
  nameInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginTop: 4,
  },
  analyzing: { alignItems: 'center', marginTop: 4 },
});
