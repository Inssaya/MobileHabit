import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PinPad from '../../components/PinPad';
import ReasonsEditor from '../../components/ReasonsEditor';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useSessionStore } from '../../lib/sessionStore';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { THEMES, THEME_ORDER } from '../../lib/theme';
import { hashPin } from '../../lib/pin';
import { CRISIS_NOTE } from '../../lib/coping';
import { exportToFile, pickBackupFile } from '../../lib/backup';
import { rescheduleAll } from '../../lib/notifications';
import { clearApiKey, detectKeyKind, getApiKey, looksLikeSupportedKey, maskApiKey, setApiKey } from '../../lib/apiKey';
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
  const addReason = useAppStore((s) => s.addReason);
  const removeReason = useAppStore((s) => s.removeReason);
  const setPinHash = useAppStore((s) => s.setPinHash);
  const resetAll = useAppStore((s) => s.resetAll);
  const notifications = useAppStore((s) => s.notifications);
  const setNotificationPrefs = useAppStore((s) => s.setNotificationPrefs);
  const urges = useAppStore((s) => s.urges);
  const exportSnapshot = useAppStore((s) => s.exportSnapshot);
  const importSnapshot = useAppStore((s) => s.importSnapshot);
  const lockVault = useSessionStore((s) => s.lockVault);

  const [editHabit, setEditHabit] = useState(false);
  const [nameAr, setNameAr] = useState(habit?.nameAr ?? '');
  const [nameEn, setNameEn] = useState(habit?.nameEn ?? '');

  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinStage, setPinStage] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState(false);

  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [editingKey, setEditingKey] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    getApiKey().then(setStoredKey);
  }, []);

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

  const updateNotifications = async (patch: Partial<typeof notifications>) => {
    const nextPrefs = { ...notifications, ...patch };
    setNotificationPrefs(patch);
    // Notifications aren't supported in a plain browser build; skip silently
    // rather than throwing during the web smoke test.
    if (Platform.OS === 'web') return;
    await rescheduleAll(nextPrefs, urges, lang).catch(() => {});
  };

  const doExport = async () => {
    const result = await exportToFile(exportSnapshot());
    if (!result.ok) flash(t('importFailed'));
  };

  const doImport = async () => {
    const { json } = await pickBackupFile();
    if (!json) return;
    setConfirmImport(json);
  };

  const confirmImportNow = () => {
    if (!confirmImport) return;
    const result = importSnapshot(confirmImport);
    setConfirmImport(null);
    flash(result.ok ? t('importSuccess') : t('importFailed'));
  };

  const saveKey = async () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    await setApiKey(trimmed);
    setStoredKey(trimmed);
    setKeyDraft('');
    setEditingKey(false);
    flash(lang === 'ar' ? 'تم حفظ المفتاح' : 'API key saved');
  };

  const removeKey = async () => {
    await clearApiKey();
    setStoredKey(null);
    setKeyDraft('');
    setEditingKey(false);
    flash(lang === 'ar' ? 'تم حذف المفتاح' : 'API key removed');
  };

  const doReset = () => {
    resetAll();
    lockVault();
    setConfirmReset(false);
    router.replace('/onboarding/language');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('language')}</Text>
        <Card style={styles.row}>
          {(['ar', 'en'] as Lang[]).map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => {
                setLang(code);
                // Scheduled notification bodies are baked in at schedule time,
                // so they have to be rebuilt in the newly chosen language.
                if (Platform.OS !== 'web' && notifications.enabled) {
                  rescheduleAll(notifications, urges, code).catch(() => {});
                }
              }}
              style={[styles.langBtn, { backgroundColor: lang === code ? theme.primary : theme.surfaceAlt }]}
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
                  style={[
                    styles.themeRow,
                    { borderColor: selected ? th.primary : th.border, borderWidth: selected ? 2 : StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: th.primary }]} />
                  <Text style={{ color: th.text, fontFamily: Fonts.medium, flex: 1 }}>
                    {lang === 'ar' ? th.nameAr : th.nameEn}
                  </Text>
                  {selected ? <Text style={{ color: th.primary, fontFamily: Fonts.black }}>✓</Text> : null}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('habit')}</Text>
        <Card style={styles.row}>
          <Text style={{ fontSize: 24 }}>{habit?.icon}</Text>
          <Text style={{ flex: 1, color: theme.text, fontFamily: Fonts.medium }}>
            {habit ? (lang === 'ar' ? habit.nameAr : habit.nameEn) : ''}
          </Text>
          <TouchableOpacity onPress={() => setEditHabit(true)}>
            <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>{tc('edit')}</Text>
          </TouchableOpacity>
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('reasons')}</Text>
        <Card>
          <ReasonsEditor reasons={habit?.reasons ?? []} onAdd={addReason} onRemove={removeReason} />
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>
          {lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
        </Text>
        <Card style={{ gap: 12 }}>
          <View style={styles.row}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: storedKey ? theme.success : theme.textFaint },
              ]}
            />
            <Text style={{ flex: 1, color: theme.text, fontFamily: Fonts.medium, fontSize: 13.5 }}>
              {storedKey
                ? lang === 'ar'
                  ? 'مُفعّل بالكامل'
                  : 'Fully enabled'
                : lang === 'ar'
                  ? 'وضع محدود (بدون مفتاح)'
                  : 'Limited mode (no key)'}
            </Text>
            {storedKey && !editingKey ? (
              <Text style={{ color: theme.textFaint, fontFamily: Fonts.body, fontSize: 11 }}>
                {maskApiKey(storedKey)}
              </Text>
            ) : null}
          </View>

          <Text style={{ color: theme.textFaint, fontFamily: Fonts.body, fontSize: 11.5, lineHeight: 17 }}>
            {lang === 'ar'
              ? 'يُحفظ المفتاح في خزنة جهازك المشفّرة فقط، ويُرسل فقط إلى الخدمة التي يخصّها (Anthropic أو OpenAI أو OpenRouter، حسب نوع المفتاح).'
              : "Your key is stored only in your device's secure keychain and is sent only to the service it belongs to (Anthropic, OpenAI, or OpenRouter, based on the key's format)."}
          </Text>
          {storedKey ? (
            <Text style={{ color: theme.textFaint, fontFamily: Fonts.body, fontSize: 11 }}>
              {(lang === 'ar' ? 'الخدمة: ' : 'Service: ') + serviceLabel(detectKeyKind(storedKey))}
            </Text>
          ) : null}

          {editingKey || !storedKey ? (
            <>
              <TextInput
                value={keyDraft}
                onChangeText={setKeyDraft}
                placeholder="sk-ant-... / sk-... / sk-or-..."
                placeholderTextColor={theme.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textAlign="left"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              {keyDraft.trim().length > 0 && !looksLikeSupportedKey(keyDraft) ? (
                <Text style={{ color: theme.warning, fontFamily: Fonts.body, fontSize: 11 }}>
                  {lang === 'ar'
                    ? 'لم أتعرّف على تنسيق هذا المفتاح — تأكد من نسخه كاملاً.'
                    : "This key's format isn't recognized — make sure it's copied in full."}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PrimaryButton
                  label={tc('save')}
                  onPress={saveKey}
                  disabled={!keyDraft.trim()}
                  style={{ flex: 1 }}
                />
                {storedKey ? (
                  <GhostButton label={tc('cancel')} onPress={() => { setEditingKey(false); setKeyDraft(''); }} />
                ) : null}
              </View>
            </>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GhostButton label={tc('edit')} onPress={() => setEditingKey(true)} style={{ flex: 1 }} />
              <GhostButton label={tc('delete')} danger onPress={removeKey} style={{ flex: 1 }} />
            </View>
          )}
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('notifications')}</Text>
        <Card style={{ gap: 4 }}>
          <ToggleRow
            label={t('notifEnable')}
            value={notifications.enabled}
            onChange={(v) => updateNotifications({ enabled: v })}
          />
          {notifications.enabled ? (
            <>
              <ToggleRow
                label={t('notifDaily')}
                value={notifications.dailyCheckIn}
                onChange={(v) => updateNotifications({ dailyCheckIn: v })}
              />
              {notifications.dailyCheckIn ? (
                <View style={styles.hourRow}>
                  <Text style={{ color: theme.textDim, fontFamily: Fonts.body, fontSize: 13 }}>{t('notifDailyHour')}</Text>
                  <View style={styles.hourPicker}>
                    <TouchableOpacity
                      onPress={() => updateNotifications({ dailyCheckInHour: (notifications.dailyCheckInHour + 23) % 24 })}
                      style={[styles.hourBtn, { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Text style={{ color: theme.text }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.text, fontFamily: Fonts.bold, minWidth: 52, textAlign: 'center' }}>
                      {notifications.dailyCheckInHour.toString().padStart(2, '0')}:00
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateNotifications({ dailyCheckInHour: (notifications.dailyCheckInHour + 1) % 24 })}
                      style={[styles.hourBtn, { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Text style={{ color: theme.text }}>＋</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <ToggleRow
                label={t('notifMilestones')}
                value={notifications.milestones}
                onChange={(v) => updateNotifications({ milestones: v })}
              />
              <ToggleRow
                label={t('notifRisky')}
                sub={t('notifRiskySub')}
                value={notifications.riskyHours}
                onChange={(v) => updateNotifications({ riskyHours: v })}
              />
            </>
          ) : null}
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('backup')}</Text>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: theme.textFaint, fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 }}>
            {t('exportNote')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton label={t('exportData')} onPress={doExport} icon="⬆️" style={{ flex: 1 }} />
            <GhostButton label={t('importData')} onPress={doImport} style={{ justifyContent: 'center' }} />
          </View>
        </Card>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('security')}</Text>
        <GhostButton label={t('changePin')} onPress={() => setChangingPin(true)} />

        <Text style={[styles.section, { color: theme.textDim }]}>{t('support')}</Text>
        <TouchableOpacity onPress={() => setShowSupport(true)} activeOpacity={0.85}>
          <Card style={styles.row}>
            <Text style={{ fontSize: 20 }}>🤍</Text>
            <Text style={{ flex: 1, color: theme.text, fontFamily: Fonts.medium, fontSize: 13.5 }}>
              {t('supportTitle')}
            </Text>
            <Text style={{ color: theme.textFaint }}>{lang === 'ar' ? '‹' : '›'}</Text>
          </Card>
        </TouchableOpacity>

        <Text style={[styles.section, { color: theme.textDim }]}>{t('about')}</Text>
        <Card>
          <Text style={{ color: theme.textDim, fontFamily: Fonts.body, fontSize: 13, lineHeight: 20 }}>{t('aboutBody')}</Text>
        </Card>

        <GhostButton label={t('resetData')} danger onPress={() => setConfirmReset(true)} style={{ marginTop: 20 }} />
      </ScrollView>

      {toast ? (
        <View style={[styles.toast, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontFamily: Fonts.medium, fontSize: 13, textAlign: 'center' }}>{toast}</Text>
        </View>
      ) : null}

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

      <Modal visible={showSupport} transparent animationType="slide" onRequestClose={() => setShowSupport(false)}>
        <View style={styles.modalBg}>
          <Card style={{ width: '100%', gap: 16, backgroundColor: theme.surface }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.bold, fontSize: 16 }}>{t('supportTitle')}</Text>
            <Text style={{ color: theme.textDim, fontFamily: Fonts.body, fontSize: 14, lineHeight: 23 }}>
              {lang === 'ar' ? CRISIS_NOTE.ar : CRISIS_NOTE.en}
            </Text>
            <PrimaryButton label={tc('close')} onPress={() => setShowSupport(false)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={confirmReset} transparent animationType="fade" onRequestClose={() => setConfirmReset(false)}>
        <View style={styles.modalBg}>
          <Card style={{ width: '100%', gap: 16, backgroundColor: theme.surface }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.bold, fontSize: 16 }}>{t('resetData')}</Text>
            <Text style={{ color: theme.danger, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 21 }}>
              {t('resetWarning')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GhostButton label={tc('delete')} danger onPress={doReset} style={{ flex: 1 }} />
              <PrimaryButton label={tc('cancel')} onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={confirmImport !== null} transparent animationType="fade" onRequestClose={() => setConfirmImport(null)}>
        <View style={styles.modalBg}>
          <Card style={{ width: '100%', gap: 16, backgroundColor: theme.surface }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.bold, fontSize: 16 }}>{t('importData')}</Text>
            <Text style={{ color: theme.textDim, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 21 }}>
              {t('importWarning')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton label={tc('continue')} onPress={confirmImportNow} style={{ flex: 1 }} />
              <GhostButton label={tc('cancel')} onPress={() => setConfirmImport(null)} />
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

function serviceLabel(kind: ReturnType<typeof detectKeyKind>): string {
  switch (kind) {
    case 'anthropic':
      return 'Anthropic (Claude)';
    case 'openai':
      return 'OpenAI';
    case 'openrouter':
      return 'OpenRouter';
    default:
      return 'Unknown';
  }
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    // The whole row toggles, not just the switch — a 13px label is a poor
    // touch target, especially one-handed.
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontFamily: Fonts.medium, fontSize: 13.5 }}>{label}</Text>
        {sub ? (
          <Text style={{ color: theme.textFaint, fontFamily: Fonts.body, fontSize: 11, marginTop: 2 }}>{sub}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
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
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  hourPicker: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15 },
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
