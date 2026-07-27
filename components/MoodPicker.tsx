import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useT, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import type { Mood } from '../lib/types';

const MOODS: { key: Mood; icon: string; labelKey: string }[] = [
  { key: 'great', icon: '😄', labelKey: 'moodGreat' },
  { key: 'good', icon: '🙂', labelKey: 'moodGood' },
  { key: 'okay', icon: '😐', labelKey: 'moodOkay' },
  { key: 'low', icon: '😕', labelKey: 'moodLow' },
  { key: 'bad', icon: '😢', labelKey: 'moodBad' },
];

export default function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (m: Mood) => void }) {
  const theme = useTheme();
  const t = useT('checkin');

  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const active = value === mood.key;
        return (
          <TouchableOpacity
            key={mood.key}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(mood.key);
            }}
            style={[
              styles.item,
              {
                backgroundColor: active ? theme.primarySoft : 'transparent',
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
          >
            <Text style={styles.icon}>{mood.icon}</Text>
            <Text style={[styles.label, { color: active ? theme.primary : theme.textFaint }]}>{t(mood.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 22 },
  label: { fontFamily: Fonts.medium, fontSize: 10.5 },
});
