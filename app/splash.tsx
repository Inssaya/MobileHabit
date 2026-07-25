import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import Screen from '../components/Screen';
import TypewriterText from '../components/TypewriterText';
import { useAppStore } from '../lib/store';
import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import { randomAyah } from '../lib/quotes';

export default function SplashScreen() {
  const theme = useTheme();
  const onboarded = useAppStore((s) => s.onboarded);
  const ayahRef = useRef(randomAyah());
  const [showRef, setShowRef] = useState(false);
  const glow = useSharedValue(0.4);
  const navigatedRef = useRef(false);

  const goNext = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(onboarded ? '/(tabs)' : '/onboarding/language');
  };

  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0.4, { duration: 1800 })), -1, true);
  }, [glow]);

  useEffect(() => {
    const timer = setTimeout(goNext, 6500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Screen>
      <Pressable style={styles.flex} onPress={goNext}>
        <View style={styles.center}>
          <Animated.View style={[styles.glowDot, glowStyle, { backgroundColor: theme.primary, shadowColor: theme.primary }]} />
          <TypewriterText
            text={ayahRef.current.arabic}
            speed={65}
            startDelay={400}
            onDone={() => setShowRef(true)}
            style={[
              styles.ayah,
              {
                color: theme.text,
                fontFamily: Fonts.quran,
                textShadowColor: theme.glow,
              },
            ]}
          />
          {showRef ? (
            <Text style={[styles.reference, { color: theme.accent }]}>{ayahRef.current.reference}</Text>
          ) : null}
        </View>
        <Text style={[styles.hint, { color: theme.textFaint }]}>﴾ اضغط للمتابعة ﴿</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glowDot: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowOpacity: 1,
    shadowRadius: 60,
    opacity: 0.4,
  },
  ayah: {
    fontSize: 30,
    lineHeight: 54,
    textAlign: 'center',
    writingDirection: 'rtl',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  reference: {
    marginTop: 22,
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  hint: {
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
});
