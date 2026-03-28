import {
  collection, query, where, getDocs,
  updateDoc, doc, Timestamp, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { addMonths, setDate, subDays } from 'date-fns';
import { db } from './firebase';
import { scheduleItemNotifications } from './notifications';

/**
 * Runs every time the app opens.
 * Replaces Cloud Functions (no Blaze plan needed).
 *
 * 1. Archive expired vouchers
 * 2. Renew handled recurring bills whose due date has passed
 * 3. Schedule local notifications for upcoming items
 */
export async function runStartupTasks(): Promise<void> {
  if (process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true') return;
  const now = Timestamp.now();

  await Promise.all([
    archiveExpiredVouchers(now),
    renewHandledBills(now),
    scheduleUpcomingNotifications(),
  ]);
}

// ── 1. Expire vouchers ────────────────────────────────

async function archiveExpiredVouchers(now: Timestamp): Promise<void> {
  const snap = await getDocs(query(
    collection(db, 'vouchers'),
    where('status', '==', 'active'),
    where('expiresAt', '<', now),
  ));
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'vouchers', d.id), { status: 'expired' });
    await addDoc(collection(db, 'history'), {
      area: 'vouchers', itemId: d.id, itemTitle: d.data().title,
      action: 'archived', performedBy: 'system', timestamp: serverTimestamp(),
    });
  }
}

// ── 2. Renew recurring bills ──────────────────────────

async function renewHandledBills(now: Timestamp): Promise<void> {
  const snap = await getDocs(query(
    collection(db, 'bills'),
    where('status', '==', 'handled'),
    where('nextDueAt', '<', now),
  ));
  for (const d of snap.docs) {
    const item     = d.data();
    const nextDate = setDate(addMonths(item.nextDueAt.toDate(), 1), item.recurringDayOfMonth);
    await updateDoc(doc(db, 'bills', d.id), {
      status: 'active',
      nextDueAt: Timestamp.fromDate(nextDate),
      handledBy: null,
      handledAt: null,
      amountPaid: null,
    });
    await addDoc(collection(db, 'history'), {
      area: 'bills', itemId: d.id, itemTitle: item.title,
      action: 'renewed', performedBy: 'system', timestamp: serverTimestamp(),
    });
  }
}

// ── 3. Schedule local notifications ──────────────────

async function scheduleUpcomingNotifications(): Promise<void> {
  // Collect all items with due dates from relevant areas
  const areas = [
    { col: 'vouchers',  dateField: 'expiresAt'  },
    { col: 'money',     dateField: 'expectedAt' },
    { col: 'bills',     dateField: 'nextDueAt'  },
    { col: 'documents', dateField: 'expiresAt'  },
  ];

  for (const { col, dateField } of areas) {
    const snap = await getDocs(query(
      collection(db, col),
      where('status', 'in', ['active', 'pending']),
    ));
    for (const d of snap.docs) {
      const item    = d.data();
      const dueDate = item[dateField]?.toDate?.();
      if (!dueDate) continue;
      await scheduleItemNotifications(d.id, item.title, dueDate);
    }
  }
}
