import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import StepDots from '../../components/StepDots';
import Card from '../../components/Card';
import ReasonsEditor from '../../components/ReasonsEditor';
import { PrimaryButton, GhostButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';

export default function ReasonsScreen() {
  const theme = useTheme();
  const t = useT('onboarding');
  const tc = useT('common');
  const habit = useAppStore((s) => s.habit);
  const addReason = useAppStore((s) => s.addReason);
  const removeReason = useAppStore((s) => s.removeReason);

  const reasons = habit?.reasons ?? [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepDots total={5} current={3} />
          <Text style={[styles.title, { color: theme.text }]}>{t('reasonsTitle')}</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>{t('reasonsSub')}</Text>

          <Card style={{ width: '100%', marginTop: 4 }}>
            <ReasonsEditor reasons={reasons} onAdd={addReason} onRemove={removeReason} />
          </Card>
        </ScrollView>

        <View style={{ gap: 12 }}>
          <PrimaryButton label={tc('continue')} onPress={() => router.push('/onboarding/pin')} />
          <GhostButton label={tc('back')} onPress={() => router.back()} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, justifyContent: 'space-between' },
  scroll: { gap: 14, alignItems: 'center', paddingBottom: 12 },
  title: { fontFamily: Fonts.black, fontSize: 24, textAlign: 'center', marginTop: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 4 },
});
