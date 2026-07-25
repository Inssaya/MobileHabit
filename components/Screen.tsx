import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlowBackground from './GlowBackground';

export default function Screen({
  children,
  style,
  edges,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <GlowBackground>
      <SafeAreaView style={[styles.safe, style]} edges={edges ?? ['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
