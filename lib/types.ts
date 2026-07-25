import type { Lang } from './i18n';
import type { ThemeId } from './theme';

export interface Habit {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  rawDescription: string;
  createdAt: number;
}

export type UrgeOutcome = 'ongoing' | 'resisted' | 'relapsed';

export interface UrgeRecord {
  id: string;
  startedAt: number;
  endedAt: number | null;
  durationSec: number | null;
  feeling: string;
  why: string;
  outcome: UrgeOutcome;
}

export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
  urgeId?: string;
  tool?: string;
}

export interface VaultMusic {
  id: string;
  uri: string;
  name: string;
  addedAt: number;
}

export interface VaultPhoto {
  id: string;
  uri: string;
  addedAt: number;
  caption?: string;
}

export interface VaultVoice {
  id: string;
  uri: string;
  durationSec: number;
  addedAt: number;
}

export interface VaultVideo {
  id: string;
  uri: string;
  kind: 'video' | 'photo';
  addedAt: number;
}

export interface VaultState {
  pinHash: string | null;
  music: VaultMusic[];
  photos: VaultPhoto[];
  voice: VaultVoice[];
  videos: VaultVideo[];
}

export interface AppState {
  hasHydrated: boolean;
  onboarded: boolean;
  lang: Lang;
  theme: ThemeId;
  habit: Habit | null;

  streakStartedAt: number | null;
  lifetimeCleanDaysBanked: number;
  bestStreakDays: number;
  resistedCount: number;
  relapseCount: number;

  urges: UrgeRecord[];
  activeUrgeId: string | null;

  chatMessages: ChatMessage[];

  vault: VaultState;
}
