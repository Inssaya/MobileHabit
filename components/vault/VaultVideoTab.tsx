import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';

import { useAppStore } from '../../lib/store';
import { useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { GhostButton, PrimaryButton } from '../Buttons';
import type { VaultVideo } from '../../lib/types';

function VideoModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <VideoView player={player} style={styles.fullVideo} nativeControls />
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.modalBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function VaultVideoTab() {
  const theme = useTheme();
  const t = useT('vault');
  const tc = useT('common');
  const videos = useAppStore((s) => s.vault.videos);
  const addVaultVideo = useAppStore((s) => s.addVaultVideo);
  const removeVaultVideo = useAppStore((s) => s.removeVaultVideo);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const capture = async (kind: VaultVideo['kind']) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: 0.9,
      videoMaxDuration: 120,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addVaultVideo({ uri: asset.uri, kind });
  };

  const openItem = videos.find((v) => v.id === openId);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('empty')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.thumbWrap}
            onPress={() => setOpenId(item.id)}
            onLongPress={() => setConfirmDelete(item.id)}
          >
            {item.kind === 'photo' ? (
              <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.videoThumb, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={{ fontSize: 22 }}>🎬</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {confirmDelete ? (
        <View style={[styles.confirmBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontFamily: Fonts.medium, flex: 1 }}>{tc('areYouSure')}</Text>
          <TouchableOpacity
            onPress={() => {
              removeVaultVideo(confirmDelete);
              setConfirmDelete(null);
            }}
          >
            <Text style={{ color: theme.danger, fontFamily: Fonts.bold }}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConfirmDelete(null)} style={{ marginStart: 16 }}>
            <Text style={{ color: theme.textFaint, fontFamily: Fonts.bold }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton label={t('capture')} onPress={() => capture('video')} icon="🎥" style={{ flex: 1 }} />
        <GhostButton label="📷" onPress={() => capture('photo')} style={styles.photoBtn} />
      </View>

      {openItem ? (
        openItem.kind === 'video' ? (
          <VideoModal uri={openItem.uri} onClose={() => setOpenId(null)} />
        ) : (
          <Modal visible transparent animationType="fade" onRequestClose={() => setOpenId(null)}>
            <View style={styles.modalBg}>
              <Image source={{ uri: openItem.uri }} style={styles.fullVideo} contentFit="contain" />
              <TouchableOpacity onPress={() => setOpenId(null)} style={styles.closeBtn}>
                <Text style={styles.modalBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 12 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 30 },
  thumbWrap: { flex: 1 / 3, aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  videoThumb: { alignItems: 'center', justifyContent: 'center' },
  photoBtn: { justifyContent: 'center', paddingHorizontal: 22 },
  confirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  fullVideo: { width: '100%', height: '80%' },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: 18, color: '#fff' },
});
