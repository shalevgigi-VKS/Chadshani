import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addDays, startOfDay, endOfDay } from 'date-fns';

if (!admin.apps.length) admin.initializeApp();
const db        = admin.firestore();
const messaging = admin.messaging();

/**
 * Runs every day at 08:00 Israel time.
 * Checks all areas with due dates and sends push to both users.
 */
export const dailyReminder = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('Asia/Jerusalem')
  .onRun(async () => {
    const tokensSnap = await db.collection('pushTokens').get();
    const tokens = tokensSnap.docs.map((d) => d.data().token as string);
    if (tokens.length === 0) return;

    const now = new Date();
    const AREAS_WITH_DATES: Array<{ collection: string; dateField: string }> = [
      { collection: 'vouchers',   dateField: 'expiresAt'   },
      { collection: 'money',      dateField: 'expectedAt'  },
      { collection: 'bills',      dateField: 'nextDueAt'   },
      { collection: 'documents',  dateField: 'expiresAt'   },
    ];

    const WINDOWS = [
      { daysAhead: 1, label: 'מחר' },
      { daysAhead: 7, label: 'בעוד שבוע' },
    ];

    for (const { collection, dateField } of AREAS_WITH_DATES) {
      for (const { daysAhead, label } of WINDOWS) {
        const target = addDays(now, daysAhead);
        const snap = await db.collection(collection)
          .where('status', 'in', ['active', 'pending'])
          .where(dateField, '>=', admin.firestore.Timestamp.fromDate(startOfDay(target)))
          .where(dateField, '<=', admin.firestore.Timestamp.fromDate(endOfDay(target)))
          .get();

        for (const docSnap of snap.docs) {
          const item = docSnap.data();
          await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: `⏰ ${item.title}`,
              body:  `${label} — ${collection === 'bills' ? 'תשלום' : collection === 'vouchers' ? 'פג תוקף שובר' : collection === 'money' ? 'כסף צפוי' : 'תוקף מסמך'}`,
            },
            data: { itemId: docSnap.id, area: collection },
          });
        }
      }
    }
  });
