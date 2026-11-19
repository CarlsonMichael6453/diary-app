import { Platform } from 'react-native';

export async function syncReminder(
  enabled: boolean,
  hour: number,
  minute: number,
  pal?: { name: string; emoji: string; saying: string },
  quiet?: { start: number; end: number },
): Promise<string> {
  const { inQuietHours } = await import('../logic/sayings');
  if (quiet && inQuietHours(hour, quiet.start, quiet.end)) {
    return 'That hour is inside quiet hours, so no reminder was scheduled.';
  }
  const title = pal ? `${pal.emoji} ${pal.name}` : 'Your diary is open';
  const body = pal?.saying ?? 'A few lines is enough. Today’s page is waiting.';
  if (Platform.OS === 'web') {
    return enabled
      ? `${title} will nudge you inside the book. ${body}`
      : 'The in-app nudge is off.';
  }
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return 'The daily reminder is off.';
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'Notifications are blocked in system settings.';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('diary', {
        name: 'Diary reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'diary',
      },
    });
    const hour12 = hour % 12 || 12;
    const suffix = hour < 12 ? 'am' : 'pm';
    return `A daily reminder is set for ${hour12}:${String(minute).padStart(2, '0')} ${suffix}.`;
  } catch {
    return 'Reminders could not be scheduled on this device.';
  }
}

/** A one-off pal line. Web keeps this in the app. Native sends it only if permission is already granted. */
export async function pingPal(title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // The in-app line still shows.
  }
}
