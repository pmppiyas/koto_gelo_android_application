export interface LocalExpense {
  id?: string;
  localId?: string;
  amount: number;
  category: string;
  subcategory?: string | null;
  title?: string | null;
  date: string;
  expenseDate?: string;
  note?: string | null;
  type?: 'PERSONAL' | 'GROUP';
  groupId?: string | null;
  groupName?: string | null;
  participants?: Array<{ userId: string; shareAmount?: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseState {
  expenses: LocalExpense[];
  isLoading: boolean;
  error: string | null;
  newlyAddedId: string | null;
}

export type ExpenseAction =
  | { type: 'expenses/setExpenses'; payload: LocalExpense[] }
  | { type: 'expenses/addExpense'; payload: LocalExpense }
  | { type: 'expenses/updateExpense'; payload: { id: string; updates: Partial<LocalExpense> } | LocalExpense }
  | { type: 'expenses/removeExpense'; payload: string }
  | { type: 'expenses/setLoading'; payload: boolean }
  | { type: 'expenses/setError'; payload: string | null }
  | { type: 'expenses/setNewlyAddedId'; payload: string | null };
