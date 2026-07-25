import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useTheme } from '../lib/hooks';

export default function GlowBackground({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glowPrimary" cx="20%" cy="8%" r="55%">
            <Stop offset="0" stopColor={theme.primary} stopOpacity={theme.dark ? 0.28 : 0.16} />
            <Stop offset="1" stopColor={theme.primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowAccent" cx="85%" cy="18%" r="45%">
            <Stop offset="0" stopColor={theme.accent} stopOpacity={theme.dark ? 0.22 : 0.14} />
            <Stop offset="1" stopColor={theme.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowLow" cx="50%" cy="100%" r="60%">
            <Stop offset="0" stopColor={theme.primary} stopOpacity={theme.dark ? 0.14 : 0.08} />
            <Stop offset="1" stopColor={theme.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowPrimary)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowAccent)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#glowLow)" />
      </Svg>
      {children}
    </View>
  );
}
