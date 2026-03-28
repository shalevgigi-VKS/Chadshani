import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AnyItem, AreaKey, HistoryAction, HistoryEntry, UserId } from '../constants/types';
import {
  subscribeToAreaLocal, createEntryLocal, updateEntryLocal,
  deleteEntryLocal, subscribeToHistoryLocal, subscribeToDocLocal,
} from './localDb';

const OFFLINE = process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true';

// ── History writer ────────────────────────────────────

export async function writeHistory(params: {
  area: AreaKey;
  itemId: string;
  itemTitle: string;
  action: HistoryAction;
  performedBy: UserId | 'system';
  changes?: Record<string, { before: unknown; after: unknown }>;
}): Promise<void> {
  if (OFFLINE) return; // handled inside localDb
  await addDoc(collection(db, 'history'), { ...params, timestamp: serverTimestamp() });
}

// ── Generic area CRUD ─────────────────────────────────

export function subscribeToArea<T extends AnyItem>(
  area: AreaKey,
  orderField: string,
  onData: (items: T[]) => void,
  orderDir: 'asc' | 'desc' = 'asc',
) {
  if (OFFLINE) return subscribeToAreaLocal<T>(area, orderField, onData, orderDir);
  const q = query(collection(db, area), orderBy(orderField, orderDir));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
  });
}

export async function createEntry<T extends Partial<AnyItem>>(
  area: AreaKey,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  performedBy: UserId,
  titleField = 'title',
): Promise<string> {
  if (OFFLINE) return createEntryLocal<T>(area, data, performedBy, titleField);
  const ref = await addDoc(collection(db, area), {
    ...data, area,
    createdBy: performedBy, updatedBy: performedBy,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await writeHistory({
    area, itemId: ref.id,
    itemTitle: String((data as Record<string, unknown>)[titleField] ?? ''),
    action: 'created', performedBy,
  });
  return ref.id;
}

export async function updateEntry(
  area: AreaKey,
  id: string,
  title: string,
  changes: Record<string, unknown>,
  performedBy: UserId,
  action: HistoryAction = 'edited',
): Promise<void> {
  if (OFFLINE) return updateEntryLocal(area, id, title, changes, performedBy, action);
  await updateDoc(doc(db, area, id), { ...changes, updatedBy: performedBy, updatedAt: serverTimestamp() });
  await writeHistory({ area, itemId: id, itemTitle: title, action, performedBy });
}

export async function deleteEntry(
  area: AreaKey,
  id: string,
  title: string,
  performedBy: UserId,
): Promise<void> {
  if (OFFLINE) return deleteEntryLocal(area, id, title, performedBy);
  await writeHistory({ area, itemId: id, itemTitle: title, action: 'deleted', performedBy });
  await deleteDoc(doc(db, area, id));
}

// ── History listener ──────────────────────────────────

export function subscribeToHistory(
  onData: (entries: HistoryEntry[]) => void,
  filterUser?: UserId,
  filterArea?: AreaKey,
) {
  if (OFFLINE) return subscribeToHistoryLocal(onData, filterUser, filterArea);
  const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    let entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryEntry));
    if (filterUser) entries = entries.filter((e) => e.performedBy === filterUser);
    if (filterArea) entries = entries.filter((e) => e.area === filterArea);
    onData(entries);
  });
}

// ── Single document listener (item detail) ───────────────────────────────────

export { subscribeToDocLocal };
