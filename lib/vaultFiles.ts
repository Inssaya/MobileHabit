import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

import { uid } from './uid';

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i) : '';
}

/**
 * Image/video/audio pickers and the recorder all hand back a URI under the
 * cache directory — which Expo documents as "a place to store files that can
 * be deleted by the system when the device runs low on storage." For a vault
 * whose entire point is holding onto something private and durable, that's
 * silent data loss waiting to happen. Copy the file into the document
 * directory (never cleared by the OS) before it's added to the vault.
 *
 * `nameHint` covers content:// URIs (from the document picker) whose path
 * has no usable extension of its own.
 */
export async function persistVaultFile(sourceUri: string, subfolder: string, nameHint?: string): Promise<string> {
  // The web File/Directory shim has no real durable storage to copy into —
  // picker URIs there are already ephemeral blob: URLs regardless.
  if (Platform.OS === 'web') return sourceUri;

  try {
    const dir = new Directory(Paths.document, 'vault', subfolder);
    dir.create({ intermediates: true, idempotent: true });

    const source = new File(sourceUri);
    const ext = source.extension || (nameHint ? extOf(nameHint) : '');
    const dest = new File(dir, `${uid()}${ext}`);
    await source.copy(dest);
    return dest.uri;
  } catch {
    // A cache-backed file the user can see today beats a hard failure that
    // silently drops their photo/recording.
    return sourceUri;
  }
}
