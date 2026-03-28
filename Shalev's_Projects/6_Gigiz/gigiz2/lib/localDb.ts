/**
 * Local storage adapter — mirrors the Firestore interface using AsyncStorage.
 * Used when EXPO_PUBLIC_OFFLINE_MODE=true (no Firebase needed).
 * Data is stored locally on the device. No sync between devices.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnyItem, AreaKey, HistoryAction, HistoryEntry, UserId } from '../constants/types';

let idCounter = Date.now();
function newId(): string {
  return `local_${++idCounter}`;
}

function makeTimestamp(date = new Date()) {
  return { toDate: () => date, seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

async function getCollection<T>(area: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(`gigiz_${area}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveCollection<T>(area: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(`gigiz_${area}`, JSON.stringify(items));
}

// ── Listeners (simple polling every 1s for local dev) ────────────────────────
const listeners: Map<string, Set<(items: AnyItem[]) => void>> = new Map();

function notifyListeners(area: string, items: AnyItem[]) {
  listeners.get(area)?.forEach((cb) => cb(items));
}

export function subscribeToAreaLocal<T extends AnyItem>(
  area: AreaKey,
  orderField: string,
  onData: (items: T[]) => void,
  orderDir: 'asc' | 'desc' = 'asc',
): () => void {
  if (!listeners.has(area)) listeners.set(area, new Set());
  listeners.get(area)!.add(onData as any);

  // Initial load
  getCollection<T>(area).then((items) => {
    const sorted = [...items].sort((a, b) => {
      const av = (a as any)[orderField];
      const bv = (b as any)[orderField];
      const aval = av?.seconds ?? (typeof av === 'string' ? av : 0);
      const bval = bv?.seconds ?? (typeof bv === 'string' ? bv : 0);
      return orderDir === 'asc' ? (aval > bval ? 1 : -1) : (aval < bval ? 1 : -1);
    });
    onData(sorted);
  });

  return () => {
    listeners.get(area)?.delete(onData as any);
  };
}

export async function createEntryLocal<T extends Partial<AnyItem>>(
  area: AreaKey,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  performedBy: UserId,
  titleField = 'title',
): Promise<string> {
  const id = newId();
  const now = makeTimestamp();
  const items = await getCollection<AnyItem>(area);
  const newItem = { ...data, id, area, createdBy: performedBy, updatedBy: performedBy, createdAt: now, updatedAt: now } as AnyItem;
  items.push(newItem);
  await saveCollection(area, items);
  notifyListeners(area, items);
  await writeHistoryLocal({ area, itemId: id, itemTitle: String((data as any)[titleField] ?? ''), action: 'created', performedBy });
  return id;
}

export async function updateEntryLocal(
  area: AreaKey,
  id: string,
  title: string,
  changes: Record<string, unknown>,
  performedBy: UserId,
  action: HistoryAction = 'edited',
): Promise<void> {
  const items = await getCollection<AnyItem>(area);
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...changes, updatedBy: performedBy, updatedAt: makeTimestamp() } as AnyItem;
    await saveCollection(area, items);
    notifyListeners(area, items);
  }
  await writeHistoryLocal({ area, itemId: id, itemTitle: title, action, performedBy });
}

export async function deleteEntryLocal(
  area: AreaKey,
  id: string,
  title: string,
  performedBy: UserId,
): Promise<void> {
  const items = await getCollection<AnyItem>(area);
  const filtered = items.filter((i) => i.id !== id);
  await saveCollection(area, filtered);
  notifyListeners(area, filtered);
  await writeHistoryLocal({ area, itemId: id, itemTitle: title, action: 'deleted', performedBy });
}

async function writeHistoryLocal(params: {
  area: AreaKey; itemId: string; itemTitle: string;
  action: HistoryAction; performedBy: UserId | 'system';
}): Promise<void> {
  const history = await getCollection<HistoryEntry>('history');
  history.unshift({ ...params, id: newId(), timestamp: makeTimestamp() } as HistoryEntry);
  await saveCollection('history', history.slice(0, 500));
}

export function subscribeToHistoryLocal(
  onData: (entries: HistoryEntry[]) => void,
  filterUser?: UserId,
  filterArea?: AreaKey,
): () => void {
  getCollection<HistoryEntry>('history').then((entries) => {
    let filtered = entries;
    if (filterUser) filtered = filtered.filter((e) => e.performedBy === filterUser);
    if (filterArea) filtered = filtered.filter((e) => e.area === filterArea);
    onData(filtered);
  });
  return () => {};
}

// Fake onSnapshot for item detail screen
export function subscribeToDocLocal(
  area: AreaKey,
  id: string,
  onData: (item: AnyItem | null) => void,
): () => void {
  getCollection<AnyItem>(area).then((items) => {
    onData(items.find((i) => i.id === id) ?? null);
  });
  return () => {};
}
