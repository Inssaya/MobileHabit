import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { analyzeUrges } from './analytics';
import type { Lang } from './i18n';
import type { NotificationPrefs, UrgeRecord } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const COPY = {
  ar: {
    dailyTitle: 'كيف كان يومك؟',
    dailyBody: 'دقيقة واحدة لتسجيل حالتك. الاستمرار أهم من الكمال.',
    riskyTitle: 'هذا وقتك الصعب عادةً',
    riskyBody: 'انتبه لنفسك في الساعة القادمة. تذكّر لماذا بدأت.',
    milestoneTitle: 'إنجاز جديد 🎉',
  },
  en: {
    dailyTitle: 'How was your day?',
    dailyBody: 'One minute to log how you are. Consistency beats perfection.',
    riskyTitle: 'This is usually your hard hour',
    riskyBody: 'Watch out for yourself in the next hour. Remember why you started.',
    milestoneTitle: 'New achievement 🎉',
  },
};

export async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    // Quiet by design: this app should never feel like it's nagging or
    // announcing itself to people nearby.
    vibrationPattern: [0, 120],
    sound: null,
  });
}

/**
 * Rebuilds the whole schedule from scratch. Cheap, and avoids the drift you
 * get from trying to diff individual scheduled notifications.
 */
export async function rescheduleAll(prefs: NotificationPrefs, urges: UrgeRecord[], lang: Lang): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled) return;

  const granted = await ensurePermission();
  if (!granted) return;
  await ensureAndroidChannel();

  const copy = COPY[lang];

  if (prefs.dailyCheckIn) {
    await Notifications.scheduleNotificationAsync({
      content: { title: copy.dailyTitle, body: copy.dailyBody },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.dailyCheckInHour,
        minute: 0,
        channelId: 'reminders',
      },
    });
  }

  if (prefs.riskyHours) {
    const insights = analyzeUrges(urges);
    if (insights.riskiestHour !== null) {
      // Fire an hour before the historical danger window, so it arrives as
      // preparation rather than as a reminder of the urge itself.
      const hour = (insights.riskiestHour + 23) % 24;
      await Notifications.scheduleNotificationAsync({
        content: { title: copy.riskyTitle, body: copy.riskyBody },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
          channelId: 'reminders',
        },
      });
    }
  }
}

export async function notifyMilestone(title: string, body: string, prefs: NotificationPrefs): Promise<void> {
  if (!prefs.enabled || !prefs.milestones) return;
  const granted = await ensurePermission();
  if (!granted) return;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
