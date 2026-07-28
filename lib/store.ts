import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Lang } from './i18n';
import type { ThemeId } from './theme';
import type {
  AppState,
  ChatMessage,
  CheckIn,
  Habit,
  Mood,
  NotificationPrefs,
  TriggerKey,
  UrgeOutcome,
  UrgeRecord,
  VaultMusic,
  VaultPhoto,
  VaultVideo,
  VaultVoice,
} from './types';
import { uid } from './uid';
import { computeCurrentStreakDays, computeTotalCleanDays, computeTotalScore } from './derived';
import { milestoneInputFromState, newlyEarned } from './milestones';
import { todayKey } from './dates';

const DAY_MS = 24 * 60 * 60 * 1000;

interface AppActions {
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemeId) => void;
  setHabit: (habit: Habit) => void;
  addReason: (reason: string) => void;
  removeReason: (index: number) => void;
  setPinHash: (hash: string | null) => void;
  completeOnboarding: () => void;

  currentStreakDays: () => number;
  totalCleanDays: () => number;
  totalScore: () => number;

  startUrge: () => string;
  updateActiveUrge: (patch: Partial<Pick<UrgeRecord, 'feeling' | 'why' | 'triggers' | 'intensity'>>) => void;
  toggleActiveUrgeTrigger: (trigger: TriggerKey) => void;
  resolveUrge: (outcome: Exclude<UrgeOutcome, 'ongoing'>) => void;
  logPastUrge: (input: {
    feeling: string;
    why: string;
    outcome: 'resisted' | 'relapsed';
    minutesAgo: number;
    triggers?: TriggerKey[];
    intensity?: number | null;
  }) => void;

  addCheckIn: (mood: Mood, note: string) => void;
  hasCheckedInToday: () => boolean;

  evaluateMilestones: () => string[];
  consumePendingMilestones: () => string[];

  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => void;

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

  exportSnapshot: () => string;
  importSnapshot: (json: string) => { ok: boolean; error?: string };

  resetAll: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  dailyCheckIn: true,
  dailyCheckInHour: 21,
  milestones: true,
  riskyHours: false,
};

const initialState: AppState = {
  hasHydrated: false,
  onboarded: false,
  lang: 'ar',
  theme: 'noor',
  habit: null,

  streakStartedAt: null,
  journeyStartedAt: null,
  lifetimeCleanDaysBanked: 0,
  bestStreakDays: 0,
  resistedCount: 0,
  relapseCount: 0,

  urges: [],
  activeUrgeId: null,

  checkIns: [],

  unlockedMilestones: [],
  pendingMilestones: [],

  chatMessages: [],

  vault: {
    pinHash: null,
    music: [],
    photos: [],
    voice: [],
    videos: [],
  },

  notifications: { ...DEFAULT_NOTIFICATION_PREFS },
};

export const STORE_VERSION = 2;

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setHabit: (habit) => set({ habit }),

      addReason: (reason) => {
        const trimmed = reason.trim();
        if (!trimmed) return;
        set((s) => (s.habit ? { habit: { ...s.habit, reasons: [...s.habit.reasons, trimmed] } } : {}));
      },
      removeReason: (index) =>
        set((s) => (s.habit ? { habit: { ...s.habit, reasons: s.habit.reasons.filter((_, i) => i !== index) } } : {})),

      setPinHash: (hash) => set((s) => ({ vault: { ...s.vault, pinHash: hash } })),

      completeOnboarding: () => {
        const now = Date.now();
        set({ onboarded: true, streakStartedAt: now, journeyStartedAt: now });
      },

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
          triggers: [],
          intensity: null,
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

      toggleActiveUrgeTrigger: (trigger) => {
        const { activeUrgeId } = get();
        if (!activeUrgeId) return;
        set((s) => ({
          urges: s.urges.map((u) =>
            u.id === activeUrgeId
              ? {
                  ...u,
                  triggers: u.triggers.includes(trigger)
                    ? u.triggers.filter((t) => t !== trigger)
                    : [...u.triggers, trigger],
                }
              : u
          ),
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

        get().evaluateMilestones();
      },

      logPastUrge: ({ feeling, why, outcome, minutesAgo, triggers = [], intensity = null }) => {
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
          triggers,
          intensity,
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
        get().evaluateMilestones();
      },

      addCheckIn: (mood, note) => {
        const day = todayKey();
        const entry: CheckIn = { id: uid(), at: Date.now(), day, mood, note: note.trim() };
        set((s) => ({ checkIns: [entry, ...s.checkIns.filter((c) => c.day !== day)] }));
        get().evaluateMilestones();
      },

      hasCheckedInToday: () => {
        const day = todayKey();
        return get().checkIns.some((c) => c.day === day);
      },

      evaluateMilestones: () => {
        const s = get();
        const input = milestoneInputFromState(s, computeCurrentStreakDays(s.streakStartedAt));
        const fresh = newlyEarned(input, s.unlockedMilestones);
        if (fresh.length > 0) {
          set((prev) => ({
            unlockedMilestones: [...prev.unlockedMilestones, ...fresh],
            pendingMilestones: [...prev.pendingMilestones, ...fresh],
          }));
        }
        return fresh;
      },

      consumePendingMilestones: () => {
        const pending = get().pendingMilestones;
        if (pending.length > 0) set({ pendingMilestones: [] });
        return pending;
      },

      setNotificationPrefs: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),

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

      exportSnapshot: () => {
        const s = get();
        // Media lives as on-device file URIs that won't survive a reinstall,
        // so the backup carries the journey data and vault metadata only.
        const payload = {
          app: 'stop-this-habit',
          version: STORE_VERSION,
          exportedAt: new Date().toISOString(),
          data: {
            lang: s.lang,
            theme: s.theme,
            habit: s.habit,
            streakStartedAt: s.streakStartedAt,
            journeyStartedAt: s.journeyStartedAt,
            lifetimeCleanDaysBanked: s.lifetimeCleanDaysBanked,
            bestStreakDays: s.bestStreakDays,
            resistedCount: s.resistedCount,
            relapseCount: s.relapseCount,
            urges: s.urges,
            checkIns: s.checkIns,
            unlockedMilestones: s.unlockedMilestones,
            chatMessages: s.chatMessages,
            notifications: s.notifications,
          },
        };
        return JSON.stringify(payload, null, 2);
      },

      importSnapshot: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed?.app !== 'stop-this-habit' || !parsed?.data) {
            return { ok: false, error: 'not-a-backup' };
          }
          const d = parsed.data;
          set({
            lang: d.lang ?? 'ar',
            theme: d.theme ?? 'noor',
            // Backfill the same way `migrate` does — an older or hand-edited
            // backup can have a habit with no `reasons` array, and every
            // reader (Home, addReason/removeReason) assumes it's always there.
            habit: d.habit ? { ...d.habit, reasons: Array.isArray(d.habit.reasons) ? d.habit.reasons : [] } : null,
            streakStartedAt: d.streakStartedAt ?? null,
            journeyStartedAt: d.journeyStartedAt ?? d.streakStartedAt ?? null,
            lifetimeCleanDaysBanked: d.lifetimeCleanDaysBanked ?? 0,
            bestStreakDays: d.bestStreakDays ?? 0,
            resistedCount: d.resistedCount ?? 0,
            relapseCount: d.relapseCount ?? 0,
            urges: Array.isArray(d.urges) ? d.urges : [],
            checkIns: Array.isArray(d.checkIns) ? d.checkIns : [],
            unlockedMilestones: Array.isArray(d.unlockedMilestones) ? d.unlockedMilestones : [],
            pendingMilestones: [],
            chatMessages: Array.isArray(d.chatMessages) ? d.chatMessages : [],
            notifications: { ...DEFAULT_NOTIFICATION_PREFS, ...(d.notifications ?? {}) },
            activeUrgeId: null,
            onboarded: true,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: 'invalid-json' };
        }
      },

      resetAll: () => set({ ...initialState, hasHydrated: true }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'stop-this-habit-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: STORE_VERSION,
      // v1 saved urges without triggers/intensity and habits without reasons.
      // Backfill them so existing users don't hit undefined on first render.
      migrate: (persisted, fromVersion) => {
        const state = persisted as Partial<AppState> | undefined;
        if (!state) return initialState;
        if (fromVersion < 2) {
          return {
            ...state,
            journeyStartedAt: state.journeyStartedAt ?? state.streakStartedAt ?? null,
            habit: state.habit ? { ...state.habit, reasons: state.habit.reasons ?? [] } : null,
            urges: (state.urges ?? []).map((u) => ({ ...u, triggers: u.triggers ?? [], intensity: u.intensity ?? null })),
            checkIns: state.checkIns ?? [],
            unlockedMilestones: state.unlockedMilestones ?? [],
            pendingMilestones: [],
            notifications: { ...DEFAULT_NOTIFICATION_PREFS, ...(state.notifications ?? {}) },
          } as AppState;
        }
        return state as AppState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
