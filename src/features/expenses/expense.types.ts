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
  type: 'PERSONAL' | 'GROUP';
  groupId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseState {
  expenses: LocalExpense[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}

export type ExpenseAction =
  | { type: 'expenses/setExpenses'; payload: LocalExpense[] }
  | { type: 'expenses/addLocalExpense'; payload: LocalExpense }
  | {
      type: 'expenses/updateExpense';
      payload: { localId: string; updates: Partial<LocalExpense> };
    }
  | { type: 'expenses/removeExpense'; payload: string }
  | {
      type: 'expenses/markExpenseSynced';
      payload: { localId: string; serverId: string };
    }
  | { type: 'expenses/setLoading'; payload: boolean }
  | { type: 'expenses/setSyncing'; payload: boolean }
  | { type: 'expenses/setError'; payload: string | null }
  | { type: 'expenses/setLastSyncedAt'; payload: string };
