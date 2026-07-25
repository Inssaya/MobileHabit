import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Lang } from './i18n';
import type { ThemeId } from './theme';
import type {
  AppState,
  ChatMessage,
  Habit,
  UrgeOutcome,
  UrgeRecord,
  VaultMusic,
  VaultPhoto,
  VaultVideo,
  VaultVoice,
} from './types';
import { uid } from './uid';
import { computeCurrentStreakDays, computeTotalCleanDays, computeTotalScore } from './derived';

const DAY_MS = 24 * 60 * 60 * 1000;

interface AppActions {
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemeId) => void;
  setHabit: (habit: Habit) => void;
  setPinHash: (hash: string | null) => void;
  completeOnboarding: () => void;

  currentStreakDays: () => number;
  totalCleanDays: () => number;
  totalScore: () => number;

  startUrge: () => string;
  updateActiveUrge: (patch: Partial<Pick<UrgeRecord, 'feeling' | 'why'>>) => void;
  resolveUrge: (outcome: Exclude<UrgeOutcome, 'ongoing'>) => void;
  logPastUrge: (feeling: string, why: string, outcome: 'resisted' | 'relapsed', minutesAgo: number) => void;

  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'at'>) => ChatMessage;
  clearChat: () => void;

  addVaultMusic: (item: Omit<VaultMusic, 'id' | 'addedAt'>) => void;
  removeVaultMusic: (id: string) => void;
  addVaultPhoto: (item: Omit<VaultPhoto, 'id' | 'addedAt'>) => void;
  removeVaultPhoto: (id: string) => void;
  addVaultVoice: (item: Omit<VaultVoice, 'id' | 'addedAt'>) => void;
  removeVaultVoice: (id: string) => void;
  addVaultVideo: (item: Omit<VaultVideo, 'id' | 'addedAt'>) => void;
  removeVaultVideo: (id: string) => void;

  resetAll: () => void;
  setHasHydrated: (v: boolean) => void;
}

const initialState: AppState = {
  hasHydrated: false,
  onboarded: false,
  lang: 'ar',
  theme: 'noor',
  habit: null,

  streakStartedAt: null,
  lifetimeCleanDaysBanked: 0,
  bestStreakDays: 0,
  resistedCount: 0,
  relapseCount: 0,

  urges: [],
  activeUrgeId: null,

  chatMessages: [],

  vault: {
    pinHash: null,
    music: [],
    photos: [],
    voice: [],
    videos: [],
  },
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setHabit: (habit) => set({ habit }),
      setPinHash: (hash) => set((s) => ({ vault: { ...s.vault, pinHash: hash } })),

      completeOnboarding: () =>
        set({
          onboarded: true,
          streakStartedAt: Date.now(),
        }),

      // Imperative-only helpers (call via getState() in event handlers or
      // inside other actions). Never use these as a useAppStore(selector) —
      // see lib/derived.ts for why that causes an infinite render loop.
      currentStreakDays: () => computeCurrentStreakDays(get().streakStartedAt),
      totalCleanDays: () => computeTotalCleanDays(get().lifetimeCleanDaysBanked, get().streakStartedAt),
      totalScore: () => computeTotalScore(get().lifetimeCleanDaysBanked, get().streakStartedAt, get().resistedCount),

      startUrge: () => {
        const id = uid();
        const record: UrgeRecord = {
          id,
          startedAt: Date.now(),
          endedAt: null,
          durationSec: null,
          feeling: '',
          why: '',
          outcome: 'ongoing',
        };
        set((s) => ({ urges: [record, ...s.urges], activeUrgeId: id }));
        return id;
      },

      updateActiveUrge: (patch) => {
        const { activeUrgeId } = get();
        if (!activeUrgeId) return;
        set((s) => ({
          urges: s.urges.map((u) => (u.id === activeUrgeId ? { ...u, ...patch } : u)),
        }));
      },

      resolveUrge: (outcome) => {
        const { activeUrgeId, streakStartedAt } = get();
        if (!activeUrgeId) return;
        const now = Date.now();

        set((s) => ({
          urges: s.urges.map((u) =>
            u.id === activeUrgeId
              ? {
                  ...u,
                  endedAt: now,
                  durationSec: Math.max(0, Math.round((now - u.startedAt) / 1000)),
                  outcome,
                }
              : u
          ),
        }));

        if (outcome === 'resisted') {
          set((s) => ({ resistedCount: s.resistedCount + 1, activeUrgeId: null }));
        } else {
          const segmentDays = streakStartedAt ? Math.max(0, (now - streakStartedAt) / DAY_MS) : 0;
          set((s) => ({
            lifetimeCleanDaysBanked: s.lifetimeCleanDaysBanked + segmentDays,
            bestStreakDays: Math.max(s.bestStreakDays, segmentDays),
            relapseCount: s.relapseCount + 1,
            streakStartedAt: now,
            activeUrgeId: null,
          }));
        }
      },

      logPastUrge: (feeling, why, outcome, minutesAgo) => {
        const now = Date.now();
        const startedAt = now - Math.max(0, minutesAgo) * 60 * 1000;
        const record: UrgeRecord = {
          id: uid(),
          startedAt,
          endedAt: now,
          durationSec: Math.max(0, Math.round((now - startedAt) / 1000)),
          feeling,
          why,
          outcome,
        };
        set((s) => ({ urges: [record, ...s.urges] }));
        if (outcome === 'resisted') {
          set((s) => ({ resistedCount: s.resistedCount + 1 }));
        } else {
          const { streakStartedAt } = get();
          const segmentDays = streakStartedAt ? Math.max(0, (now - streakStartedAt) / DAY_MS) : 0;
          set((s) => ({
            lifetimeCleanDaysBanked: s.lifetimeCleanDaysBanked + segmentDays,
            bestStreakDays: Math.max(s.bestStreakDays, segmentDays),
            relapseCount: s.relapseCount + 1,
            streakStartedAt: now,
          }));
        }
      },

      addChatMessage: (msg) => {
        const full: ChatMessage = { ...msg, id: uid(), at: Date.now() };
        set((s) => ({ chatMessages: [...s.chatMessages, full] }));
        return full;
      },
      clearChat: () => set({ chatMessages: [] }),

      addVaultMusic: (item) =>
        set((s) => ({
          vault: { ...s.vault, music: [{ ...item, id: uid(), addedAt: Date.now() }, ...s.vault.music] },
        })),
      removeVaultMusic: (id) =>
        set((s) => ({ vault: { ...s.vault, music: s.vault.music.filter((m) => m.id !== id) } })),

      addVaultPhoto: (item) =>
        set((s) => ({
          vault: { ...s.vault, photos: [{ ...item, id: uid(), addedAt: Date.now() }, ...s.vault.photos] },
        })),
      removeVaultPhoto: (id) =>
        set((s) => ({ vault: { ...s.vault, photos: s.vault.photos.filter((p) => p.id !== id) } })),

      addVaultVoice: (item) =>
        set((s) => ({
          vault: { ...s.vault, voice: [{ ...item, id: uid(), addedAt: Date.now() }, ...s.vault.voice] },
        })),
      removeVaultVoice: (id) =>
        set((s) => ({ vault: { ...s.vault, voice: s.vault.voice.filter((v) => v.id !== id) } })),

      addVaultVideo: (item) =>
        set((s) => ({
          vault: { ...s.vault, videos: [{ ...item, id: uid(), addedAt: Date.now() }, ...s.vault.videos] },
        })),
      removeVaultVideo: (id) =>
        set((s) => ({ vault: { ...s.vault, videos: s.vault.videos.filter((v) => v.id !== id) } })),

      resetAll: () => set({ ...initialState, hasHydrated: true }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'stop-this-habit-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
