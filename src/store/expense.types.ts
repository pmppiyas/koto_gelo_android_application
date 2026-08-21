export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface LocalExpense {
  localId: string;
  serverId?: string | null;
  amount: number;
  category: string;
  subcategory?: string | null;
  title?: string | null;
  date: string;
  note?: string | null;
  syncStatus: SyncStatus;
  type?: 'PERSONAL' | 'GROUP';
  groupId?: string | null;
  groupName?: string | null;
  participants?: Array<{ userId: string; shareAmount?: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseState {
  expenses: LocalExpense[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  newlyAddedId: string | null;
}

export type ExpenseAction =
  | { type: 'expenses/setExpenses'; payload: LocalExpense[] }
  | { type: 'expenses/addLocalExpense'; payload: LocalExpense }
  | { type: 'expenses/updateExpense'; payload: LocalExpense }
  | { type: 'expenses/removeExpense'; payload: string }
  | { type: 'expenses/setLoading'; payload: boolean }
  | { type: 'expenses/setSyncing'; payload: boolean }
  | { type: 'expenses/setError'; payload: string | null }
  | { type: 'expenses/setLastSyncedAt'; payload: string }
  | { type: 'expenses/setNewlyAddedId'; payload: string | null };
