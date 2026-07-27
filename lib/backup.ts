import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { dayKey } from './dates';

function backupFileName(): string {
  return `stop-this-habit-backup-${dayKey()}.json`;
}

/**
 * Writes the snapshot to a real file and hands it to the OS share sheet, so
 * the user can put it wherever they actually trust (Drive, Files, email).
 */
export async function exportToFile(json: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      // expo-sharing is a no-op on web; trigger a normal browser download.
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName();
      link.click();
      URL.revokeObjectURL(url);
      return { ok: true };
    }

    const file = new File(Paths.cache, backupFileName());
    if (file.exists) file.delete();
    file.create();
    file.write(json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: backupFileName(),
        UTI: 'public.json',
      });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'export-failed' };
  }
}

/** Returns the raw JSON text of a user-picked backup file, or null if cancelled. */
export async function pickBackupFile(): Promise<{ json: string | null; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return { json: null };

    const asset = result.assets[0];

    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      return { json: await response.text() };
    }

    const file = new File(asset.uri);
    return { json: await file.text() };
  } catch (e) {
    return { json: null, error: e instanceof Error ? e.message : 'read-failed' };
  }
}
