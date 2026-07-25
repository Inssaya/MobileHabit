import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export default function ToolChip({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginEnd: 10,
  },
  icon: { fontSize: 15 },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
});
