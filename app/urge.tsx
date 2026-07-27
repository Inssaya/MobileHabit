import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Chronometer from '../components/Chronometer';
import TriggerChips from '../components/TriggerChips';
import IntensityScale from '../components/IntensityScale';
import BreathingOrb from '../components/BreathingOrb';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import { useAppStore } from '../lib/store';
import { useTheme, useT, useLang } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import { copingFor } from '../lib/coping';
import { randomAyah } from '../lib/quotes';
import { triggerDef } from '../lib/triggers';

type SosMode = 'breathe' | 'verse' | 'move' | null;

export default function UrgeScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('urge');
  const tc = useT('common');

  const activeUrgeId = useAppStore((s) => s.activeUrgeId);
  const urges = useAppStore((s) => s.urges);
  const habit = useAppStore((s) => s.habit);
  const updateActiveUrge = useAppStore((s) => s.updateActiveUrge);
  const toggleActiveUrgeTrigger = useAppStore((s) => s.toggleActiveUrgeTrigger);
  const resolveUrge = useAppStore((s) => s.resolveUrge);
  const startUrge = useAppStore((s) => s.startUrge);

  const active = activeUrgeId ? urges.find((u) => u.id === activeUrgeId) : null;

  const [feeling, setFeeling] = useState(active?.feeling ?? '');
  const [why, setWhy] = useState(active?.why ?? '');
  const [sos, setSos] = useState<SosMode>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [confirming, setConfirming] = useState<'resisted' | 'relapsed' | null>(null);

  const ayah = useMemo(() => randomAyah(), []);
  const exercise = useMemo(() => copingFor(habit?.key, lang), [habit?.key, lang]);

  useEffect(() => {
    if (!activeUrgeId) startUrge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => updateActiveUrge({ feeling, why });

  const finish = (outcome: 'resisted' | 'relapsed') => {
    commit();
    Haptics.notificationAsync(
      outcome === 'resisted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});
    setConfirming(outcome);
  };

  const confirmFinish = () => {
    if (!confirming) return;
    resolveUrge(confirming);
    setConfirming(null);
    router.replace('/(tabs)');
  };

  const talkToAI = () => {
    commit();
    router.replace('/(tabs)/chat');
  };

  const selectedTriggers = active?.triggers ?? [];
  const intensity = active?.intensity ?? null;
  const reasons = habit?.reasons ?? [];
  const activeTriggerTip = selectedTriggers.length > 0 ? triggerDef(selectedTriggers[selectedTriggers.length - 1]) : undefined;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.danger }]}>{t('title')}</Text>
            <Text style={[styles.subtitle, { color: theme.textDim }]}>{t('subtitle')}</Text>
          </View>

          <Card style={styles.chronoCard}>
            <Text style={[styles.elapsedLabel, { color: theme.textDim }]}>{t('elapsed')}</Text>
            <Chronometer startedAt={active?.startedAt ?? Date.now()} size="medium" />
            <Text style={[styles.waveNote, { color: theme.textFaint }]}>{t('waveNote')}</Text>
          </Card>

          {/* SOS row first: during a real urge the useful actions must be reachable
              before any typing is asked of the user. */}
          <View style={styles.sosRow}>
            <SosButton label={t('sosBreathe')} icon="🌬️" onPress={() => setSos('breathe')} />
            <SosButton label={t('sosVerse')} icon="📿" onPress={() => setSos('verse')} />
            <SosButton label={t('sosMove')} icon="⚡" onPress={() => setSos('move')} />
          </View>

          {reasons.length > 0 ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowWhy((v) => !v)}>
              <Card style={{ ...styles.whyCard, borderColor: theme.accent }}>
                <Text style={[styles.whyToggle, { color: theme.accent }]}>
                  {showWhy ? '▲' : '▼'}  {t('remindMeWhy')}
                </Text>
                {showWhy ? (
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={[styles.yourWords, { color: theme.textFaint }]}>{t('yourWords')}</Text>
                    {reasons.map((reason, i) => (
                      <Text key={i} style={[styles.reason, { color: theme.text }]}>
                        ❝ {reason}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Card>
            </TouchableOpacity>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('triggersLabel')}</Text>
            <TriggerChips selected={selectedTriggers} onToggle={toggleActiveUrgeTrigger} />
            {activeTriggerTip ? (
              <Card style={{ ...styles.tipCard, borderColor: theme.primary }}>
                <Text style={[styles.tipText, { color: theme.text }]}>
                  {activeTriggerTip.icon}  {lang === 'ar' ? activeTriggerTip.tipAr : activeTriggerTip.tipEn}
                </Text>
              </Card>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('intensityLabel')}</Text>
            <IntensityScale
              value={intensity}
              onChange={(v) => updateActiveUrge({ intensity: v })}
              lowLabel={t('intensityLow')}
              highLabel={t('intensityHigh')}
            />
            {intensity !== null && intensity >= 8 ? (
              <Text style={[styles.highIntensity, { color: theme.danger }]}>{t('highIntensityNote')}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              {t('feelingLabel')} <Text style={{ color: theme.textFaint, fontSize: 12 }}>({tc('optional')})</Text>
            </Text>
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
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              {t('whyLabel')} <Text style={{ color: theme.textFaint, fontSize: 12 }}>({tc('optional')})</Text>
            </Text>
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

        {/* SOS sheet */}
        <Modal visible={sos !== null} transparent animationType="slide" onRequestClose={() => setSos(null)}>
          <View style={styles.sheetBg}>
            <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{t('sosTitle')}</Text>

              {sos === 'breathe' ? <BreathingOrb /> : null}

              {sos === 'verse' ? (
                <View style={{ gap: 12, alignItems: 'center' }}>
                  <Text style={[styles.ayah, { color: theme.text }]}>{ayah.arabic}</Text>
                  <Text style={[styles.ayahRef, { color: theme.accent }]}>{ayah.reference}</Text>
                  <Text style={[styles.ayahReflection, { color: theme.textDim }]}>
                    {lang === 'ar' ? ayah.reflectionAr : ayah.reflectionEn}
                  </Text>
                </View>
              ) : null}

              {sos === 'move' ? (
                <View style={{ gap: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 44 }}>{exercise.icon}</Text>
                  <Text style={[styles.exerciseText, { color: theme.text }]}>{exercise.text}</Text>
                </View>
              ) : null}

              <PrimaryButton label={tc('close')} onPress={() => setSos(null)} style={{ alignSelf: 'stretch' }} />
            </View>
          </View>
        </Modal>

        {/* Outcome confirmation. A custom sheet rather than Alert.alert so the
            wording and tone stay under our control on every platform. */}
        <Modal visible={confirming !== null} transparent animationType="fade" onRequestClose={() => setConfirming(null)}>
          <View style={styles.sheetBg}>
            <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={{ fontSize: 44 }}>{confirming === 'resisted' ? '🛡️' : '🤍'}</Text>
              <Text style={[styles.confirmText, { color: theme.text }]}>
                {confirming === 'resisted' ? t('confirmResist') : t('confirmRelapse')}
              </Text>
              <PrimaryButton label={tc('done')} onPress={confirmFinish} style={{ alignSelf: 'stretch' }} />
              <GhostButton label={tc('cancel')} onPress={() => setConfirming(null)} />
            </View>
          </View>
        </Modal>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function SosButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={[styles.sosBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }]}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.sosLabel, { color: theme.text }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, justifyContent: 'space-between' },
  scroll: { gap: 18, paddingBottom: 16 },
  header: { gap: 6, alignItems: 'center', marginTop: 4 },
  title: { fontFamily: Fonts.black, fontSize: 24 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center' },
  chronoCard: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  elapsedLabel: { fontFamily: Fonts.medium, fontSize: 12 },
  waveNote: { fontFamily: Fonts.body, fontSize: 11.5, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  sosRow: { flexDirection: 'row', gap: 10 },
  sosBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sosLabel: { fontFamily: Fonts.medium, fontSize: 11.5, textAlign: 'center' },
  whyCard: { borderWidth: 1 },
  whyToggle: { fontFamily: Fonts.bold, fontSize: 14 },
  yourWords: { fontFamily: Fonts.body, fontSize: 11 },
  reason: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
  field: { gap: 10 },
  fieldLabel: { fontFamily: Fonts.bold, fontSize: 14 },
  tipCard: { borderWidth: 1, paddingVertical: 12 },
  tipText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 20 },
  highIntensity: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 18 },
  input: { minHeight: 64, fontFamily: Fonts.body, fontSize: 14, lineHeight: 20 },
  freeChoice: { fontFamily: Fonts.body, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  actions: { gap: 10, marginTop: 8 },
  sheetBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 22 },
  sheet: { alignItems: 'center', gap: 16, padding: 24, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 17 },
  ayah: { fontFamily: Fonts.quran, fontSize: 21, lineHeight: 42, textAlign: 'center' },
  ayahRef: { fontFamily: Fonts.medium, fontSize: 13 },
  ayahReflection: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exerciseText: { fontFamily: Fonts.body, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  confirmText: { fontFamily: Fonts.body, fontSize: 15, textAlign: 'center', lineHeight: 23 },
});
