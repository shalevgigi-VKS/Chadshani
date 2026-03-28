import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { subDays, isAfter } from 'date-fns';
import { UserId } from '../constants/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Called after user selects their profile — requests permission for local notifications
export async function registerPushToken(_userId: UserId): Promise<void> {
  await requestNotificationPermission();
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'גיגיז',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return status === 'granted';
}

export async function scheduleItemNotifications(
  itemId: string,
  title: string,
  dueDate: Date,
): Promise<void> {
  const now = new Date();

  // Cancel existing notifications for this item first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.itemId === itemId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const sevenBefore = subDays(dueDate, 7);
  if (isAfter(sevenBefore, now)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${title}`,
        body: 'בעוד שבוע — כדאי לטפל',
        data: { itemId },
      },
      trigger: { date: sevenBefore },
    });
  }

  const oneBefore = subDays(dueDate, 1);
  if (isAfter(oneBefore, now)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔴 ${title}`,
        body: 'מחר — יום אחרון לטיפול',
        data: { itemId },
      },
      trigger: { date: oneBefore },
    });
  }
}

export async function cancelItemNotifications(itemId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.itemId === itemId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
