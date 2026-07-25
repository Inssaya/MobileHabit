import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useAppStore } from '../../lib/store';
import { useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { GhostButton, PrimaryButton } from '../Buttons';

const GAP = 8;

export default function VaultPhotosTab() {
  const theme = useTheme();
  const t = useT('vault');
  const photos = useAppStore((s) => s.vault.photos);
  const addVaultPhoto = useAppStore((s) => s.addVaultPhoto);
  const removeVaultPhoto = useAppStore((s) => s.removeVaultPhoto);
  const [preview, setPreview] = useState<string | null>(null);

  const fromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: true });
    if (result.canceled) return;
    result.assets.forEach((a) => addVaultPhoto({ uri: a.uri }));
  };

  const capture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    result.assets.forEach((a) => addVaultPhoto({ uri: a.uri }));
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 8 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('empty')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.thumbWrap} onPress={() => setPreview(item.id)}>
            <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
          </TouchableOpacity>
        )}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton label={t('addPhoto')} onPress={fromLibrary} icon="🖼" style={{ flex: 1 }} />
        <GhostButton label={t('capture')} onPress={capture} style={styles.captureBtn} />
      </View>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBg}>
          {preview ? (
            <>
              <Image source={{ uri: photos.find((p) => p.id === preview)?.uri }} style={styles.fullImage} contentFit="contain" />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    removeVaultPhoto(preview);
                    setPreview(null);
                  }}
                  style={[styles.modalBtn, { backgroundColor: theme.danger }]}
                >
                  <Text style={styles.modalBtnText}>🗑</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPreview(null)} style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={styles.modalBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 12 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 30 },
  thumbWrap: { flex: 1 / 3, aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  captureBtn: { justifyContent: 'center', paddingHorizontal: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: '100%', height: '80%' },
  modalActions: { flexDirection: 'row', gap: 20, marginTop: 20 },
  modalBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 20 },
});
