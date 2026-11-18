import { Platform } from 'react-native';

export async function syncReminder(enabled: boolean, hour: number, minute: number): Promise<string> {
  if (Platform.OS === 'web') {
    return enabled
      ? 'On the website, Diary App nudges you inside the book if today’s page is still blank.'
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
        title: 'Your diary is open',
        body: 'A few lines is enough. Today’s page is waiting.',
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
