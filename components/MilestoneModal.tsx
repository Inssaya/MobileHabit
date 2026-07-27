import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PrimaryButton } from './Buttons';
import { useLang, useT, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import { milestoneByKey } from '../lib/milestones';

export default function MilestoneModal({ milestoneKey, onClose }: { milestoneKey: string | null; onClose: () => void }) {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('milestone');
  const scale = useSharedValue(0.6);
  const glow = useSharedValue(0.12);

  const milestone = milestoneKey ? milestoneByKey(milestoneKey) : undefined;

  useEffect(() => {
    if (milestoneKey) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      scale.value = 0.6;
      scale.value = withSpring(1, { damping: 9, stiffness: 120 });
      // Kept deliberately faint: this sits *behind* the icon and text, so
      // anything above ~0.3 reads as an opaque disc rather than a glow.
      glow.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [milestoneKey, scale, glow]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  if (!milestone) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
          <Animated.View style={[styles.iconRing, glowStyle, { borderColor: theme.accent }]} />
          <Animated.Text style={[styles.icon, badgeStyle]}>{milestone.icon}</Animated.Text>
          <Text style={[styles.kicker, { color: theme.accent }]}>{t('unlocked')}</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {lang === 'ar' ? milestone.titleAr : milestone.titleEn}
          </Text>
          <Text style={[styles.body, { color: theme.textDim }]}>
            {lang === 'ar' ? milestone.bodyAr : milestone.bodyEn}
          </Text>
          <Text style={[styles.note, { color: theme.textFaint }]}>{t('shareNote')}</Text>
          <PrimaryButton label={t('keepGoing')} onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    padding: 28,
    borderRadius: 26,
    borderWidth: 1,
  },
  // A pulsing outline rather than a filled disc: a large soft shadow renders
  // as an opaque grey halo on web and swallows the text behind it.
  iconRing: {
    position: 'absolute',
    top: 18,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
  },
  icon: { fontSize: 62 },
  kicker: { fontFamily: Fonts.bold, fontSize: 12, letterSpacing: 1 },
  title: { fontFamily: Fonts.black, fontSize: 24, textAlign: 'center' },
  body: { fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  note: { fontFamily: Fonts.body, fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 4 },
});
