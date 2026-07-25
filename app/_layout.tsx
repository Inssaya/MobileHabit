import { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useAppFonts } from '../lib/fonts';
import { useAppStore } from '../lib/store';
import { useTheme } from '../lib/hooks';
import UrgeWidget from '../components/UrgeWidget';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const theme = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => {});
  }, [theme.bg]);

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
