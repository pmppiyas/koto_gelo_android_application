import { expenseRepository } from './database/repositories/expense.repository';
import { LocalExpense } from '../features/expenses/expense.types';

export const localExpenseService = {
  async getLocalExpenses(): Promise<LocalExpense[]> {
    return await expenseRepository.getAll();
  },

  async setLocalExpenses(expenses: LocalExpense[]): Promise<void> {
    await expenseRepository.saveAll(expenses);
  },

  async saveExpenseLocally(expense: LocalExpense): Promise<void> {
    await expenseRepository.save(expense);
  },

  async updateLocalExpense(localId: string, updates: Partial<LocalExpense>): Promise<void> {
    await expenseRepository.update(localId, updates);
  },

  async deleteLocalExpense(localId: string): Promise<void> {
    await expenseRepository.delete(localId);
  },

  async getPendingExpenses(): Promise<LocalExpense[]> {
    return await expenseRepository.getPending();
  },

  async markExpenseAsSynced(localId: string, serverId: string): Promise<void> {
    await expenseRepository.markAsSynced(localId, serverId);
  },

  async clearLocalExpenses(): Promise<void> {
    await expenseRepository.clear();
  },
};
