import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '../../components/Screen';
import PinPad from '../../components/PinPad';
import VaultMusicTab from '../../components/vault/VaultMusicTab';
import VaultPhotosTab from '../../components/vault/VaultPhotosTab';
import VaultVoiceTab from '../../components/vault/VaultVoiceTab';
import VaultVideoTab from '../../components/vault/VaultVideoTab';
import { useAppStore } from '../../lib/store';
import { useSessionStore } from '../../lib/sessionStore';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { verifyPin } from '../../lib/pin';

type Segment = 'music' | 'photos' | 'voice' | 'video';

// Only resets when the app process restarts — that's enough to stop someone
// idly guessing all 10,000 four-digit combinations by hand, which is the
// actual threat model for a PIN this short.
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 30000;

export default function VaultScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('vault');
  const pinHash = useAppStore((s) => s.vault.pinHash);
  const vaultUnlocked = useSessionStore((s) => s.vaultUnlocked);
  const unlockVault = useSessionStore((s) => s.unlockVault);

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [segment, setSegment] = useState<Segment>('music');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null;

  const handlePin = async (value: string) => {
    if (isLocked) return;
    setPin(value);
    if (value.length === 4) {
      const ok = await verifyPin(value, pinHash);
      if (ok) {
        setFailedAttempts(0);
        unlockVault();
      } else {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        setError(true);
        setTimeout(() => {
          setError(false);
          setPin('');
        }, 700);
        if (attempts >= LOCKOUT_THRESHOLD) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
        }
      }
    }
  };

  if (!vaultUnlocked) {
    const lockedMsg =
      lang === 'ar' ? `محاولات كثيرة. حاول بعد ${secondsLeft} ثانية.` : `Too many attempts. Try again in ${secondsLeft}s.`;
    return (
      <Screen style={styles.lockScreen}>
        <View style={{ alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <Text style={{ fontSize: 44 }}>🔒</Text>
          <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>
            {isLocked ? lockedMsg : error ? t('wrongPin') : t('enterPin')}
          </Text>
        </View>
        <PinPad value={pin} onChange={handlePin} error={error} />
      </Screen>
    );
  }

  const segments: { key: Segment; label: string; icon: string }[] = [
    { key: 'music', label: t('music'), icon: '🎵' },
    { key: 'photos', label: t('photos'), icon: '🖼' },
    { key: 'voice', label: t('voice'), icon: '🎙' },
    { key: 'video', label: t('video'), icon: '🎬' },
  ];

  return (
    <Screen style={styles.screen}>
      <Text style={[styles.title, { color: theme.text, marginBottom: 12 }]}>{t('title')}</Text>
      <View style={[styles.segmentRow, { backgroundColor: theme.surfaceAlt }]}>
        {segments.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSegment(s.key)}
            style={[styles.segmentBtn, segment === s.key ? { backgroundColor: theme.primary } : null]}
          >
            <Text style={{ fontSize: 13 }}>{s.icon}</Text>
            <Text
              style={[
                styles.segmentLabel,
                { color: segment === s.key ? (theme.dark ? '#052A26' : '#fff') : theme.textDim },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {segment === 'music' ? <VaultMusicTab /> : null}
        {segment === 'photos' ? <VaultPhotosTab /> : null}
        {segment === 'voice' ? <VaultVoiceTab /> : null}
        {segment === 'video' ? <VaultVideoTab /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lockScreen: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  screen: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flex: 1 },
  title: { fontFamily: Fonts.black, fontSize: 22 },
  sub: { fontFamily: Fonts.body, fontSize: 13 },
  segmentRow: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 14 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 10 },
  segmentLabel: { fontFamily: Fonts.medium, fontSize: 11 },
  content: { flex: 1 },
});
