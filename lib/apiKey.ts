import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'anthropic_api_key';

/**
 * The key lives in the device keychain/keystore, never in the persisted app
 * store (which is plain AsyncStorage and gets written to backup files).
 * On web SecureStore is unavailable, so we degrade to AsyncStorage — acceptable
 * only because web is a development target here, not a shipping surface.
 */
export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(KEY);
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, trimmed);
    return;
  }
  await SecureStore.setItemAsync(KEY, trimmed);
}

export async function clearApiKey(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}

/** Shows enough to recognise the key without exposing it. */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function looksLikeAnthropicKey(key: string): boolean {
  return /^sk-ant-/.test(key.trim());
}

export type KeyKind = 'anthropic' | 'openrouter' | 'openai' | 'unknown';

/**
 * The key's prefix alone tells us which provider it belongs to and which
 * endpoint to call — no separate "which provider" setting to keep in sync.
 */
export function detectKeyKind(key: string): KeyKind {
  const k = key.trim();
  if (/^sk-ant-/.test(k)) return 'anthropic';
  if (/^sk-or-/.test(k)) return 'openrouter';
  if (/^sk-/.test(k)) return 'openai';
  return 'unknown';
}

export function looksLikeSupportedKey(key: string): boolean {
  return detectKeyKind(key) !== 'unknown';
}
