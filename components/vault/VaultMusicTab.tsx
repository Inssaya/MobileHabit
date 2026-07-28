import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import Card from '../Card';
import { PrimaryButton } from '../Buttons';
import { useAppStore } from '../../lib/store';
import { useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { persistVaultFile } from '../../lib/vaultFiles';

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function NowPlayingBar({ uri, name, onClose }: { uri: string; name: string; onClose: () => void }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  return (
    <Card style={styles.nowPlaying}>
      <TouchableOpacity onPress={() => (status.playing ? player.pause() : player.play())} style={[styles.playBtn, { backgroundColor: theme.primary }]}>
        <Text style={{ fontSize: 16 }}>{status.playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.trackName, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.trackTime, { color: theme.textDim }]}>
          {formatTime(status.currentTime)} / {formatTime(status.duration)}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose}>
        <Text style={{ color: theme.textFaint, fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </Card>
  );
}

export default function VaultMusicTab() {
  const theme = useTheme();
  const t = useT('vault');
  const music = useAppStore((s) => s.vault.music);
  const addVaultMusic = useAppStore((s) => s.addVaultMusic);
  const removeVaultMusic = useAppStore((s) => s.removeVaultMusic);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: true });
    if (result.canceled || !result.assets) return;
    for (const asset of result.assets) {
      const uri = await persistVaultFile(asset.uri, 'music', asset.name);
      addVaultMusic({ uri, name: asset.name ?? 'Track' });
    }
  };

  const playing = music.find((m) => m.id === nowPlaying);

  return (
    <View style={styles.wrap}>
      {playing ? <NowPlayingBar uri={playing.uri} name={playing.name} onClose={() => setNowPlaying(null)} /> : null}
      <FlatList
        data={music}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('empty')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <TouchableOpacity style={styles.rowMain} onPress={() => setNowPlaying(item.id)}>
              <Text style={{ fontSize: 20 }}>🎵</Text>
              <Text numberOfLines={1} style={[styles.rowName, { color: theme.text }]}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeVaultMusic(item.id)}>
              <Text style={{ color: theme.danger, fontSize: 16 }}>🗑</Text>
            </TouchableOpacity>
          </Card>
        )}
      />
      <PrimaryButton label={t('addMusic')} onPress={pick} icon="➕" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 12 },
  list: { gap: 10, paddingBottom: 8 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowName: { fontFamily: Fonts.medium, fontSize: 14, flex: 1 },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  trackName: { fontFamily: Fonts.bold, fontSize: 13 },
  trackTime: { fontFamily: Fonts.body, fontSize: 11, marginTop: 2 },
});
