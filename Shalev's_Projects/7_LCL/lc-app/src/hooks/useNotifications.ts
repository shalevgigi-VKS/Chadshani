// useNotifications.ts
// Requests browser notification permission and shows alerts.
// Works when the app tab is open or backgrounded.
// For fully-closed push (iPhone background), FCM + Cloud Functions are needed.

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendLocalNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon, dir: 'rtl', lang: 'he' })
}
