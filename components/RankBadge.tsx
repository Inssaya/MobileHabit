import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Rank } from '../lib/ranks';
import { useLang, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export default function RankBadge({ rank, size = 'medium' }: { rank: Rank; size?: 'small' | 'medium' | 'large' }) {
  const theme = useTheme();
  const lang = useLang();
  const name = lang === 'ar' ? rank.nameAr : rank.nameEn;
  const dims = size === 'large' ? 96 : size === 'medium' ? 64 : 40;
  const fontSize = size === 'large' ? 40 : size === 'medium' ? 26 : 18;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[rank.colorFrom, rank.colorTo]}
        style={[
          styles.badge,
          {
            width: dims,
            height: dims,
            borderRadius: dims / 2,
            shadowColor: rank.colorTo,
          },
        ]}
      >
        <Text style={{ fontSize }}>{rank.icon}</Text>
      </LinearGradient>
      <Text style={[styles.name, { color: theme.text, fontSize: size === 'large' ? 20 : 15 }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  name: { fontFamily: Fonts.bold },
});
