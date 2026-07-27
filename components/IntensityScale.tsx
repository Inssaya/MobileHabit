import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Colour ramp from calm teal to alarm red as intensity climbs. */
function colorFor(level: number, theme: { primary: string; warning: string; danger: string }) {
  if (level <= 3) return theme.primary;
  if (level <= 7) return theme.warning;
  return theme.danger;
}

export default function IntensityScale({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {LEVELS.map((level) => {
          const active = value !== null && level <= value;
          return (
            <TouchableOpacity
              key={level}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onChange(level);
              }}
              style={[
                styles.segment,
                {
                  backgroundColor: active ? colorFor(value ?? level, theme) : theme.surfaceAlt,
                  borderColor: value === level ? theme.text : 'transparent',
                  borderWidth: value === level ? 2 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: active ? (theme.dark ? '#04211E' : '#fff') : theme.textFaint },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.edgeLabel, { color: theme.textFaint }]}>{lowLabel}</Text>
        <Text style={[styles.edgeLabel, { color: theme.textFaint }]}>{highLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontFamily: Fonts.medium, fontSize: 11 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  edgeLabel: { fontFamily: Fonts.body, fontSize: 11 },
});
