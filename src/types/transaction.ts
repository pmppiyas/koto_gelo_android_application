export type TransactionType = 'expense' | 'income' | 'settlement';

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string;
  icon?: string;
  groupId?: string;
  groupName?: string;
  paidBy?: string;
}

export interface BalanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  youOwe: number;
  youAreOwed: number;
  currency: string;
}
