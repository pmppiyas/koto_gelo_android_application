import { storage } from '../config/storage';
import { LocalExpense } from '../features/expenses/expense.types';

const EXPENSES_STORAGE_KEY = 'kotogelo_offline_expenses';

export const localExpenseService = {
  async getLocalExpenses(): Promise<LocalExpense[]> {
    const raw = await storage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  async setLocalExpenses(expenses: LocalExpense[]): Promise<void> {
    await storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  },

  async saveExpenseLocally(expense: LocalExpense): Promise<void> {
    const current = await this.getLocalExpenses();
    const existingIndex = current.findIndex((item) => item.localId === expense.localId);

    let updated: LocalExpense[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...expense, updatedAt: new Date().toISOString() };
    } else {
      updated = [expense, ...current];
    }

    await this.setLocalExpenses(updated);
  },

  async updateLocalExpense(localId: string, updates: Partial<LocalExpense>): Promise<void> {
    const current = await this.getLocalExpenses();
    const updated = current.map((item) => {
      if (item.localId === localId) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    await this.setLocalExpenses(updated);
  },

  async deleteLocalExpense(localId: string): Promise<void> {
    const current = await this.getLocalExpenses();
    const updated = current.filter((item) => item.localId !== localId);
    await this.setLocalExpenses(updated);
  },

  async getPendingExpenses(): Promise<LocalExpense[]> {
    const all = await this.getLocalExpenses();
    return all.filter((item) => item.syncStatus === 'pending' || item.syncStatus === 'failed');
  },

  async markExpenseAsSynced(localId: string, serverId: string): Promise<void> {
    await this.updateLocalExpense(localId, {
      serverId,
      syncStatus: 'synced',
    });
  },
};
