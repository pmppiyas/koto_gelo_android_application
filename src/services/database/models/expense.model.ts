export interface ExpenseEntity {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  paidBy: string;
  groupId?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}
