import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme, useT } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const theme = useTheme();
  const t = useT('tabs');

  const icons: Record<string, { active: IconName; inactive: IconName }> = {
    index: { active: 'home', inactive: 'home-outline' },
    chat: { active: 'sparkles', inactive: 'sparkles-outline' },
    journey: { active: 'trending-up', inactive: 'trending-up-outline' },
    vault: { active: 'lock-closed', inactive: 'lock-closed-outline' },
    settings: { active: 'settings', inactive: 'settings-outline' },
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: theme.dark ? 'rgba(16,27,54,0.92)' : 'rgba(255,255,255,0.92)', borderTopColor: theme.border },
        ],
        tabBarBackground: () =>
          theme.dark ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null,
        tabBarIcon: ({ focused, color, size }) => {
          const set = icons[route.name];
          const name = focused ? set.active : set.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="chat" options={{ title: t('chat') }} />
      <Tabs.Screen name="journey" options={{ title: t('journey') }} />
      <Tabs.Screen name="vault" options={{ title: t('vault') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 84,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
