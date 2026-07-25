import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../lib/store';
import { useLang, useT, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import { useElapsed } from './Chronometer';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function UrgeWidget() {
  const theme = useTheme();
  const t = useT('urge');
  const lang = useLang();
  const pathname = usePathname();
  const activeUrgeId = useAppStore((s) => s.activeUrgeId);
  const urges = useAppStore((s) => s.urges);
  const insets = useSafeAreaInsets();

  const active = activeUrgeId ? urges.find((u) => u.id === activeUrgeId) : null;
  const { hours, minutes, seconds } = useElapsed(active?.startedAt ?? null);

  if (!active || pathname === '/urge') return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/urge')}
      style={[styles.wrap, { top: insets.top + 8 }]}
    >
      <LinearGradient colors={[theme.danger, '#B23A3A']} style={[styles.pill, { shadowColor: theme.danger }]}>
        <View style={styles.dotPulse} />
        <Text style={styles.time}>
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {t('widgetTitle')}
        </Text>
        <Text style={styles.cta}>{lang === 'ar' ? '💬 تحدث' : '💬 Talk'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  time: { fontFamily: Fonts.bold, color: '#fff', fontSize: 13 },
  label: { fontFamily: Fonts.medium, color: '#fff', fontSize: 12, opacity: 0.9 },
  cta: { fontFamily: Fonts.bold, color: '#fff', fontSize: 12, marginStart: 4 },
});
