import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addMonths, setDate } from 'date-fns';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Runs every day at 00:01 Israel time.
 *
 * vouchers  — expired → status = 'expired'
 * money     — overdue → status stays 'pending', logged in history as reminder
 * bills     — paid (handled) past due date → nextDueAt advances one month, resets to active
 * documents — expired expiresAt → logs warning to history, does NOT delete
 */
export const archiveExpired = functions.pubsub
  .schedule('1 0 * * *')
  .timeZone('Asia/Jerusalem')
  .onRun(async () => {
    const now   = admin.firestore.Timestamp.now();
    const batch = db.batch();

    // ── Vouchers ────────────────────────────────────────
    const vouchers = await db.collection('vouchers')
      .where('status', '==', 'active')
      .where('expiresAt', '<', now)
      .get();

    for (const d of vouchers.docs) {
      batch.update(d.ref, { status: 'expired', updatedAt: now });
      batch.set(db.collection('history').doc(), {
        area: 'vouchers', itemId: d.id, itemTitle: d.data().title,
        action: 'archived', performedBy: 'system', timestamp: now,
      });
    }

    // ── Bills — reset recurring after handling ──────────
    const bills = await db.collection('bills')
      .where('status', '==', 'handled')
      .where('nextDueAt', '<', now)
      .get();

    for (const d of bills.docs) {
      const item    = d.data();
      const nextDate = setDate(
        addMonths(item.nextDueAt.toDate(), 1),
        item.recurringDayOfMonth,
      );
      batch.update(d.ref, {
        status: 'active',
        nextDueAt: admin.firestore.Timestamp.fromDate(nextDate),
        handledBy: admin.firestore.FieldValue.delete(),
        handledAt: admin.firestore.FieldValue.delete(),
        amountPaid: admin.firestore.FieldValue.delete(),
        updatedAt: now,
      });
      batch.set(db.collection('history').doc(), {
        area: 'bills', itemId: d.id, itemTitle: d.data().title,
        action: 'renewed', performedBy: 'system', timestamp: now,
      });
    }

    // ── Documents — log expiry warning ──────────────────
    const docs = await db.collection('documents')
      .where('expiresAt', '<', now)
      .get();

    for (const d of docs.docs) {
      // Check if already warned this month
      const existing = await db.collection('history')
        .where('itemId', '==', d.id)
        .where('action', '==', 'archived')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      if (existing.empty) {
        batch.set(db.collection('history').doc(), {
          area: 'documents', itemId: d.id, itemTitle: d.data().title,
          action: 'archived', performedBy: 'system', timestamp: now,
        });
      }
    }

    await batch.commit();
  });
