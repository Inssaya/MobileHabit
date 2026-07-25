import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[style, { opacity: disabled ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={[theme.primary, theme.dark ? '#1CA69D' : '#0B5C55']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primaryBtn, { shadowColor: theme.primary }]}
      >
        {loading ? (
          <ActivityIndicator color={theme.dark ? '#052A26' : '#fff'} />
        ) : (
          <Text style={[styles.primaryLabel, { color: theme.dark ? '#052A26' : '#fff' }]}>
            {icon ? `${icon}  ` : ''}
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({
  label,
  onPress,
  style,
  danger,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  danger?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={style}>
      <Text
        style={[
          styles.ghostLabel,
          { color: danger ? theme.danger : theme.textDim, borderColor: danger ? theme.danger : theme.border },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  ghostLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
