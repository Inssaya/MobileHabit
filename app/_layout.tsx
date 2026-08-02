import { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, View } from 'react-native';

import { useAppFonts } from '../lib/fonts';
import { useAppStore } from '../lib/store';
import { useSessionStore } from '../lib/sessionStore';
import { useTheme } from '../lib/hooks';
import UrgeWidget from '../components/UrgeWidget';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const theme = useTheme();
  const lockVault = useSessionStore((s) => s.lockVault);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => {});
  }, [theme.bg]);

  useEffect(() => {
    // The vault PIN is a privacy gate for sensitive media, so it must not stay
    // unlocked once the app leaves the foreground (someone else picking up the
    // phone, or backgrounding it to switch apps).
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') lockVault();
    });
    return () => sub.remove();
  }, [lockVault]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }} onLayout={() => {}}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="urge" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
      <UrgeWidget />
    </View>
  );
}

export default function RootLayout() {
  const { loaded, error } = useAppFonts();
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  const ready = (loaded || !!error) && hasHydrated;

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (ready) {
      onLayoutRootView();
    }
  }, [ready, onLayoutRootView]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutInner />
    </GestureHandlerRootView>
  );
}
