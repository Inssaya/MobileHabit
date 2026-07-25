import * as Crypto from 'expo-crypto';

const SALT = 'stop-this-habit-vault-v1';

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${SALT}:${pin}`);
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  const candidate = await hashPin(pin);
  return candidate === hash;
}
