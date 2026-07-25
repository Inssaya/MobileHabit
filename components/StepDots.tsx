import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../lib/hooks';

export default function StepDots({ total, current }: { total: number; current: number }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? theme.primary : theme.border,
              width: i === current ? 22 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
