import { Timestamp } from 'firebase/firestore';

// ── Users ─────────────────────────────────────────────
export type UserId = 'shalo' | 'lee';

// ── Area keys ─────────────────────────────────────────
export type AreaKey =
  | 'tasks'
  | 'shopping'
  | 'vouchers'
  | 'money'
  | 'bills'
  | 'goals'
  | 'documents';

// ── Shared base ───────────────────────────────────────
interface BaseEntry {
  id: string;
  createdBy: UserId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: UserId;
}

// ── TASKS — shared todo list ──────────────────────────
export interface TaskItem extends BaseEntry {
  area: 'tasks';
  text: string;
  done: boolean;
  doneBy?: UserId;
  doneAt?: Timestamp;
}

// ── SHOPPING — shared grocery list ───────────────────
export interface ShoppingItem extends BaseEntry {
  area: 'shopping';
  text: string;
  quantity?: string;
  checked: boolean;
  checkedBy?: UserId;
  checkedAt?: Timestamp;
}

// ── VOUCHERS ──────────────────────────────────────────
export type VoucherStatus = 'active' | 'used' | 'expired';
export interface VoucherItem extends BaseEntry {
  area: 'vouchers';
  title: string;
  code?: string;
  description?: string;
  expiresAt: Timestamp;
  status: VoucherStatus;
  usedBy?: UserId;
  usedAt?: Timestamp;
}

// ── MONEY — expected income / refunds ────────────────
export type MoneyStatus = 'pending' | 'received';
export interface MoneyItem extends BaseEntry {
  area: 'money';
  title: string;
  amount: number;
  source: string;
  expectedAt: Timestamp;
  status: MoneyStatus;
  receivedBy?: UserId;
  receivedAt?: Timestamp;
  notes?: string;
}

// ── BILLS — recurring fixed payments ─────────────────
export type BillStatus = 'active' | 'handled';
export interface BillItem extends BaseEntry {
  area: 'bills';
  title: string;
  amount?: number;
  amountPaid?: number;
  recurringDayOfMonth: number;
  nextDueAt: Timestamp;
  status: BillStatus;
  handledBy?: UserId;
  handledAt?: Timestamp;
}

// ── GOALS — savings targets ───────────────────────────
export interface GoalItem extends BaseEntry {
  area: 'goals';
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: Timestamp;
  notes?: string;
}

// ── DOCUMENTS ─────────────────────────────────────────
export type DocumentType = 'image' | 'pdf';
export interface DocumentItem extends BaseEntry {
  area: 'documents';
  title: string;
  description?: string;
  fileType: DocumentType;
  storageUrl: string;
  expiresAt?: Timestamp;  // תוקף תעודה, חוזה וכו'
  tags?: string[];
}

// ── Union ─────────────────────────────────────────────
export type AnyItem =
  | TaskItem
  | ShoppingItem
  | VoucherItem
  | MoneyItem
  | BillItem
  | GoalItem
  | DocumentItem;

// ── History ───────────────────────────────────────────
export type HistoryAction =
  | 'created' | 'edited' | 'deleted'
  | 'completed' | 'uncompleted'
  | 'handled' | 'received' | 'used'
  | 'archived' | 'renewed';

export interface HistoryEntry {
  id: string;
  area: AreaKey;
  itemId: string;
  itemTitle: string;
  action: HistoryAction;
  performedBy: UserId | 'system';
  timestamp: Timestamp;
  changes?: Record<string, { before: unknown; after: unknown }>;
}

// ── Push tokens ───────────────────────────────────────
export interface PushToken {
  userId: UserId;
  token: string;
  platform: 'ios' | 'android';
  updatedAt: Timestamp;
}
