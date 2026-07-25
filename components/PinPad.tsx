import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function PinPad({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const theme = useTheme();

  const press = (key: string) => {
    if (key === '') return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < PIN_LENGTH) onChange(value + key);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: error ? theme.danger : theme.primary,
                backgroundColor: i < value.length ? (error ? theme.danger : theme.primary) : 'transparent',
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((k, i) => (
          <TouchableOpacity
            key={i}
            disabled={k === ''}
            onPress={() => press(k)}
            style={[styles.key, { backgroundColor: k === '' ? 'transparent' : theme.surfaceAlt }]}
            activeOpacity={0.6}
          >
            <Text style={[styles.keyLabel, { color: theme.text }]}>{k === 'del' ? '⌫' : k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 28 },
  dots: { flexDirection: 'row', gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', gap: 14 },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 26, fontFamily: Fonts.medium },
});
