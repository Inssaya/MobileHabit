import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useLang, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

const PHASES_AR = ['شهيق...', 'احبس...', 'زفير...'];
const PHASES_EN = ['Inhale...', 'Hold...', 'Exhale...'];
const DURATIONS = [4000, 7000, 8000];

export default function BreathingOrb() {
  const theme = useTheme();
  const lang = useLang();
  const scale = useSharedValue(0.6);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: DURATIONS[0], easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: DURATIONS[1] }),
        withTiming(0.6, { duration: DURATIONS[2], easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    let phase = 0;
    setPhaseIndex(0);
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      timeout = setTimeout(() => {
        phase = (phase + 1) % 3;
        setPhaseIndex(phase);
        cycle();
      }, DURATIONS[phase]);
    };
    cycle();
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const phases = lang === 'ar' ? PHASES_AR : PHASES_EN;

  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { borderColor: theme.primarySoft }]} />
      <Animated.View
        style={[
          styles.orb,
          animatedStyle,
          { backgroundColor: theme.primarySoft, shadowColor: theme.primary, borderColor: theme.primary },
        ]}
      />
      <Text style={[styles.phase, { color: theme.text }]}>{phases[phaseIndex]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', height: 220 },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    position: 'absolute',
  },
  phase: { fontFamily: Fonts.bold, fontSize: 18, marginTop: 190, position: 'absolute' },
});
