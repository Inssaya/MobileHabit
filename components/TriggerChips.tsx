import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { TRIGGERS } from '../lib/triggers';
import { useLang, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import type { TriggerKey } from '../lib/types';

export default function TriggerChips({
  selected,
  onToggle,
}: {
  selected: TriggerKey[];
  onToggle: (key: TriggerKey) => void;
}) {
  const theme = useTheme();
  const lang = useLang();

  return (
    <View style={styles.wrap}>
      {TRIGGERS.map((trigger) => {
        const active = selected.includes(trigger.key);
        return (
          <TouchableOpacity
            key={trigger.key}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onToggle(trigger.key);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.surfaceAlt,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
          >
            <Text style={styles.icon}>{trigger.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: active ? (theme.dark ? '#052A26' : '#fff') : theme.textDim },
              ]}
            >
              {lang === 'ar' ? trigger.labelAr : trigger.labelEn}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 13 },
  label: { fontFamily: Fonts.medium, fontSize: 12.5 },
});
