import type { Lang } from './i18n';
import type { ThemeId } from './theme';

export interface Habit {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  rawDescription: string;
  createdAt: number;
  /** User's own stated reasons for quitting, resurfaced back to them mid-urge. */
  reasons: string[];
}

export type UrgeOutcome = 'ongoing' | 'resisted' | 'relapsed';

/** HALT-style quick-tap triggers so logging works without typing. */
export type TriggerKey =
  | 'hungry'
  | 'angry'
  | 'lonely'
  | 'tired'
  | 'bored'
  | 'stressed'
  | 'aroused'
  | 'anxious'
  | 'idle'
  | 'sad';

export interface UrgeRecord {
  id: string;
  startedAt: number;
  endedAt: number | null;
  durationSec: number | null;
  feeling: string;
  why: string;
  outcome: UrgeOutcome;
  triggers: TriggerKey[];
  /** 1-10 self-reported craving strength, null if never set. */
  intensity: number | null;
}

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'bad';

export interface CheckIn {
  id: string;
  at: number;
  /** Local YYYY-MM-DD, used to enforce one check-in per day. */
  day: string;
  mood: Mood;
  note: string;
}

export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
  urgeId?: string;
  tool?: string;
  /** Human-readable labels for the tools the assistant ran to produce this reply. */
  steps?: string[];
  /** UI the reply asked us to render (breathing orb, fight-mode prompt). */
  uiAction?: 'breathing' | 'open_urge_screen' | 'verse';
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

export interface NotificationPrefs {
  enabled: boolean;
  dailyCheckIn: boolean;
  /** Hour of day (0-23) for the daily check-in reminder. */
  dailyCheckInHour: number;
  milestones: boolean;
  riskyHours: boolean;
}

export interface AppState {
  hasHydrated: boolean;
  onboarded: boolean;
  lang: Lang;
  theme: ThemeId;
  habit: Habit | null;

  streakStartedAt: number | null;
  journeyStartedAt: number | null;
  lifetimeCleanDaysBanked: number;
  bestStreakDays: number;
  resistedCount: number;
  relapseCount: number;

  urges: UrgeRecord[];
  activeUrgeId: string | null;

  checkIns: CheckIn[];

  /** Milestone keys the user has already unlocked (see lib/milestones.ts). */
  unlockedMilestones: string[];
  /** Milestones unlocked but not yet shown in the celebration screen. */
  pendingMilestones: string[];

  chatMessages: ChatMessage[];

  vault: VaultState;

  notifications: NotificationPrefs;
}
