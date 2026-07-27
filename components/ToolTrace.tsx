import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

/**
 * Shows what the assistant actually did before answering. This is a trust
 * surface as much as a status one — the user can see it read their real data
 * rather than improvising.
 */
export default function ToolTrace({ steps, pending }: { steps: string[]; pending?: boolean }) {
  const theme = useTheme();
  if (steps.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {steps.map((label, i) => (
        <View key={i} style={[styles.chip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.icon, { color: pending ? theme.warning : theme.primary }]}>
            {pending ? '◌' : '✓'}
          </Text>
          <Text style={[styles.label, { color: theme.textFaint }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5, marginVertical: 6, paddingHorizontal: 4, alignItems: 'flex-start' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 10, fontFamily: Fonts.bold },
  label: { fontFamily: Fonts.body, fontSize: 11 },
});
