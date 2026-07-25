import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PinPad from '../../components/PinPad';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useSessionStore } from '../../lib/sessionStore';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { THEMES, THEME_ORDER } from '../../lib/theme';
import { hashPin } from '../../lib/pin';
import type { Lang } from '../../lib/i18n';

export default function SettingsScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('settings');
  const tc = useT('common');

  const setLang = useAppStore((s) => s.setLang);
  const themeId = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const habit = useAppStore((s) => s.habit);
  const setHabit = useAppStore((s) => s.setHabit);
  const setPinHash = useAppStore((s) => s.setPinHash);
  const resetAll = useAppStore((s) => s.resetAll);
  const lockVault = useSessionStore((s) => s.lockVault);

  const [editHabit, setEditHabit] = useState(false);
  const [nameAr, setNameAr] = useState(habit?.nameAr ?? '');
  const [nameEn, setNameEn] = useState(habit?.nameEn ?? '');

  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinStage, setPinStage] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (pinStage === 'create' && newPin.length === 4) {
      setTimeout(() => setPinStage('confirm'), 150);
    }
  }, [newPin, pinStage]);

  useEffect(() => {
    if (pinStage === 'confirm' && confirmNewPin.length === 4) {
      if (confirmNewPin === newPin) {
        hashPin(newPin).then((hash) => {
          setPinHash(hash);
          setChangingPin(false);
          setPinStage('create');
          setNewPin('');
          setConfirmNewPin('');
        });
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinError(false);
          setConfirmNewPin('');
        }, 700);
      }
    }
  }, [confirmNewPin, newPin, pinStage, setPinHash]);

  const saveHabit = () => {
    if (!habit) return;
    setHabit({ ...habit, nameAr: nameAr.trim() || habit.nameAr, nameEn: nameEn.trim() || habit.nameEn });
    setEditHabit(false);
  };

  const doReset = () => {
    Alert.alert(t('resetData'), t('resetWarning'), [
      { text: tc('cancel'), style: 'cancel' },
      {
        text: tc('delete'),
        style: 'destructive',
        onPress: () => {
          resetAll();
          lockVault();
          router.replace('/onboarding/language');
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('language')}</Text>
        <Card style={styles.row}>
          {(['ar', 'en'] as Lang[]).map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => setLang(code)}
              style={[
                styles.langBtn,
                { backgroundColor: lang === code ? theme.primary : theme.surfaceAlt },
              ]}
            >
              <Text style={{ color: lang === code ? (theme.dark ? '#052A26' : '#fff') : theme.text, fontFamily: Fonts.medium }}>
                {code === 'ar' ? 'العربية' : 'English'}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('theme')}</Text>
        <View style={{ gap: 10 }}>
          {THEME_ORDER.map((id) => {
            const th = THEMES[id];
            const selected = themeId === id;
            return (
              <TouchableOpacity key={id} onPress={() => setTheme(id)}>
                <LinearGradient
                  colors={th.gradient}
                  style={[styles.themeRow, { borderColor: selected ? th.primary : th.border, borderWidth: selected ? 2 : StyleSheet.hairlineWidth }]}
                >
                  <View style={[styles.swatch, { backgroundColor: th.primary }]} />
                  <Text style={{ color: th.text, fontFamily: Fonts.medium, flex: 1 }}>{lang === 'ar' ? th.nameAr : th.nameEn}</Text>
                  {selected ? <Text style={{ color: th.primary, fontFamily: Fonts.black }}>✓</Text> : null}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('habit')}</Text>
        <Card style={styles.row}>
          <Text style={{ fontSize: 24 }}>{habit?.icon}</Text>
          <Text style={{ flex: 1, color: theme.text, fontFamily: Fonts.medium }}>{habit ? (lang === 'ar' ? habit.nameAr : habit.nameEn) : ''}</Text>
          <TouchableOpacity onPress={() => setEditHabit(true)}>
            <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>{tc('edit')}</Text>
          </TouchableOpacity>
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('security')}</Text>
        <GhostButton label={t('changePin')} onPress={() => setChangingPin(true)} />

        <Text style={[styles.section, { color: theme.textDim }]}>{t('about')}</Text>
        <Card>
          <Text style={{ color: theme.textDim, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20 }}>{t('aboutBody')}</Text>
        </Card>

        <GhostButton label={t('resetData')} danger onPress={doReset} style={{ marginTop: 20 }} />
      </ScrollView>

      <Modal visible={editHabit} transparent animationType="slide" onRequestClose={() => setEditHabit(false)}>
        <View style={styles.modalBg}>
          <Card style={{ width: '100%', gap: 12, backgroundColor: theme.surface }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.bold, fontSize: 16 }}>{t('habit')}</Text>
            <TextInput
              value={nameAr}
              onChangeText={setNameAr}
              textAlign="right"
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <TextInput
              value={nameEn}
              onChangeText={setNameEn}
              textAlign="left"
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton label={tc('save')} onPress={saveHabit} style={{ flex: 1 }} />
              <GhostButton label={tc('cancel')} onPress={() => setEditHabit(false)} />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={changingPin} transparent animationType="slide" onRequestClose={() => setChangingPin(false)}>
        <View style={styles.modalBg}>
          <Card style={{ width: '100%', alignItems: 'center', gap: 16, backgroundColor: theme.surface }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.bold, fontSize: 16 }}>
              {pinStage === 'create' ? t('changePin') : tc('done')}
            </Text>
            <PinPad
              value={pinStage === 'create' ? newPin : confirmNewPin}
              onChange={pinStage === 'create' ? setNewPin : setConfirmNewPin}
              error={pinError}
            />
            <GhostButton
              label={tc('cancel')}
              onPress={() => {
                setChangingPin(false);
                setPinStage('create');
                setNewPin('');
                setConfirmNewPin('');
              }}
            />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60, gap: 10 },
  title: { fontFamily: Fonts.black, fontSize: 24, marginBottom: 6 },
  section: { fontFamily: Fonts.bold, fontSize: 13, marginTop: 14, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 20 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15 },
});
