import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export interface Bar {
  label: string;
  value: number;
  /** Optional split: portion of `value` that was a relapse, drawn in danger colour. */
  negative?: number;
  highlight?: boolean;
}

/**
 * Deliberately built from Views rather than SVG paths — the data here is a
 * handful of bars, and plain flex boxes scale correctly with the theme and
 * font size without any layout maths.
 */
export default function BarChart({ bars, height = 120 }: { bars: Bar[]; height?: number }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {bars.map((bar, i) => {
          const total = (bar.value / max) * (height - 22);
          const negative = bar.negative ? (bar.negative / max) * (height - 22) : 0;
          const positive = Math.max(0, total - negative);
          return (
            <View key={i} style={styles.column}>
              <Text style={[styles.value, { color: bar.value > 0 ? theme.textDim : 'transparent' }]}>{bar.value}</Text>
              <View style={styles.stack}>
                {negative > 0 ? (
                  <View style={[styles.bar, { height: negative, backgroundColor: theme.danger }]} />
                ) : null}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(bar.value > 0 ? 4 : 2, positive),
                      backgroundColor: bar.value > 0 ? (bar.highlight ? theme.accent : theme.primary) : theme.border,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {bars.map((bar, i) => (
          <Text key={i} style={[styles.label, { color: bar.highlight ? theme.accent : theme.textFaint }]} numberOfLines={1}>
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  stack: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '78%', borderRadius: 4 },
  value: { fontFamily: Fonts.medium, fontSize: 10 },
  labels: { flexDirection: 'row', gap: 5, marginTop: 6 },
  label: { flex: 1, textAlign: 'center', fontFamily: Fonts.body, fontSize: 9.5 },
});
