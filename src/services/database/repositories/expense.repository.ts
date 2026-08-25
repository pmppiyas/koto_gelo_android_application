import { database } from '../database';
import { LocalExpense } from '../../../features/expenses/expense.types';

class ExpenseRepository {
  async getAll(): Promise<LocalExpense[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM personal_expenses ORDER BY date DESC, createdAt DESC'
    );

    return rows.map((r) => ({
      localId: r.localId,
      serverId: r.serverId || null,
      amount: Number(r.amount),
      category: r.category,
      subcategory: r.subcategory || null,
      title: r.title || null,
      note: r.note || null,
      date: r.date,
      syncStatus: r.syncStatus as any,
      type: 'PERSONAL',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getById(localId: string): Promise<LocalExpense | null> {
    await database.init();
    const row = await database.db.getFirstAsync<any>(
      'SELECT * FROM personal_expenses WHERE localId = ?',
      [localId]
    );

    if (!row) return null;

    return {
      localId: row.localId,
      serverId: row.serverId || null,
      amount: Number(row.amount),
      category: row.category,
      subcategory: row.subcategory || null,
      title: row.title || null,
      note: row.note || null,
      date: row.date,
      syncStatus: row.syncStatus as any,
      type: 'PERSONAL',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async save(expense: LocalExpense): Promise<void> {
    await database.init();
    await database.db.runAsync(
      `INSERT OR REPLACE INTO personal_expenses (
        localId, serverId, amount, category, subcategory, title, note, date, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.localId || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        expense.serverId || null,
        Number(expense.amount || 0),
        expense.category || 'General',
        expense.subcategory || null,
        expense.title || null,
        expense.note || null,
        expense.date || new Date().toISOString().slice(0, 10),
        expense.syncStatus || 'pending',
        expense.createdAt || new Date().toISOString(),
        expense.updatedAt || new Date().toISOString(),
      ],
    );
  }

  async saveAll(expenses: LocalExpense[]): Promise<void> {
    await database.init();
    for (const exp of expenses) {
      await this.save(exp);
    }
  }

  async update(localId: string, updates: Partial<LocalExpense>): Promise<void> {
    await database.init();
    const existing = await this.getById(localId);
    if (!existing) return;

    const merged: LocalExpense = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.save(merged);
  }

  async delete(localId: string): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM personal_expenses WHERE localId = ?', [localId]);
  }

  async getPending(): Promise<LocalExpense[]> {
    await database.init();
    const all = await this.getAll();
    return all.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'failed');
  }

  async markAsSynced(localId: string, serverId: string): Promise<void> {
    await this.update(localId, {
      serverId,
      syncStatus: 'synced',
    });
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM personal_expenses');
  }
}

export const expenseRepository = new ExpenseRepository();
