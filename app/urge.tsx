import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Chronometer from '../components/Chronometer';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import { useAppStore } from '../lib/store';
import { useTheme, useT, useLang } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export default function UrgeScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('urge');
  const tc = useT('common');

  const activeUrgeId = useAppStore((s) => s.activeUrgeId);
  const urges = useAppStore((s) => s.urges);
  const updateActiveUrge = useAppStore((s) => s.updateActiveUrge);
  const resolveUrge = useAppStore((s) => s.resolveUrge);
  const startUrge = useAppStore((s) => s.startUrge);

  const active = activeUrgeId ? urges.find((u) => u.id === activeUrgeId) : null;

  const [feeling, setFeeling] = useState(active?.feeling ?? '');
  const [why, setWhy] = useState(active?.why ?? '');

  useEffect(() => {
    if (!activeUrgeId) {
      startUrge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => {
    updateActiveUrge({ feeling, why });
  };

  const finish = (outcome: 'resisted' | 'relapsed') => {
    commit();
    Alert.alert(
      outcome === 'resisted' ? t('confirmResist') : t('confirmRelapse'),
      undefined,
      [
        {
          text: tc('done'),
          onPress: () => {
            resolveUrge(outcome);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const talkToAI = () => {
    commit();
    router.replace('/(tabs)/chat');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.danger }]}>{t('title')}</Text>
            <Text style={[styles.subtitle, { color: theme.textDim }]}>{t('subtitle')}</Text>
          </View>

          <Card style={styles.chronoCard}>
            <Text style={[styles.elapsedLabel, { color: theme.textDim }]}>{t('elapsed')}</Text>
            <Chronometer startedAt={active?.startedAt ?? Date.now()} size="medium" />
          </Card>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('feelingLabel')}</Text>
            <Card>
              <TextInput
                value={feeling}
                onChangeText={setFeeling}
                onBlur={commit}
                placeholder={t('feelingPlaceholder')}
                placeholderTextColor={theme.textFaint}
                multiline
                textAlign={lang === 'ar' ? 'right' : 'left'}
                style={[styles.input, { color: theme.text }]}
              />
            </Card>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('whyLabel')}</Text>
            <Card>
              <TextInput
                value={why}
                onChangeText={setWhy}
                onBlur={commit}
                placeholder={t('whyPlaceholder')}
                placeholderTextColor={theme.textFaint}
                multiline
                textAlign={lang === 'ar' ? 'right' : 'left'}
                style={[styles.input, { color: theme.text }]}
              />
            </Card>
          </View>

          <Text style={[styles.freeChoice, { color: theme.textFaint }]}>{t('freeChoice')}</Text>

          <GhostButton label={`💬  ${t('talkToAI')}`} onPress={talkToAI} />
        </ScrollView>

        <View style={styles.actions}>
          <PrimaryButton label={t('iResisted')} onPress={() => finish('resisted')} icon="🛡️" />
          <GhostButton label={t('iRelapsed')} danger onPress={() => finish('relapsed')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, justifyContent: 'space-between' },
  scroll: { gap: 16, paddingBottom: 12 },
  header: { gap: 6, alignItems: 'center', marginTop: 4 },
  title: { fontFamily: Fonts.black, fontSize: 24 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center' },
  chronoCard: { alignItems: 'center', paddingVertical: 20, gap: 2 },
  elapsedLabel: { fontFamily: Fonts.medium, fontSize: 12 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: Fonts.bold, fontSize: 14 },
  input: { minHeight: 70, fontFamily: Fonts.body, fontSize: 14, lineHeight: 20 },
  freeChoice: { fontFamily: Fonts.body, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  actions: { gap: 10, marginTop: 8 },
});
