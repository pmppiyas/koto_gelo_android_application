import { database } from '../database';
import { LocalExpense } from '../../../features/expenses/expense.types';

class ExpenseRepository {
  async getAll(): Promise<LocalExpense[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM personal_expenses ORDER BY date DESC, createdAt DESC'
    );

    // Strict deduplication by serverId and localId
    const seenServerIds = new Set<string>();
    const seenLocalIds = new Set<string>();
    const result: LocalExpense[] = [];

    for (const r of rows) {
      if (r.serverId && seenServerIds.has(r.serverId)) continue;
      if (seenLocalIds.has(r.localId)) continue;

      if (r.serverId) seenServerIds.add(r.serverId);
      seenLocalIds.add(r.localId);

      result.push({
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
      });
    }

    return result;
  }

  async getById(localIdOrServerId: string): Promise<LocalExpense | null> {
    await database.init();
    const row = await database.db.getFirstAsync<any>(
      'SELECT * FROM personal_expenses WHERE localId = ? OR serverId = ?',
      [localIdOrServerId, localIdOrServerId]
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
    const serverId = expense.serverId || null;
    let localId = expense.localId;

    if (!localId && serverId) {
      const existing = await database.db.getFirstAsync<any>(
        'SELECT localId FROM personal_expenses WHERE serverId = ?',
        [serverId]
      );
      if (existing?.localId) {
        localId = existing.localId;
      }
    }

    if (!localId) {
      localId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    // Clean up any stale rows with the same serverId but different localId
    if (serverId) {
      await database.db.runAsync(
        'DELETE FROM personal_expenses WHERE localId != ? AND serverId = ?',
        [localId, serverId]
      );
    }

    await database.db.runAsync(
      `INSERT OR REPLACE INTO personal_expenses (
        localId, serverId, amount, category, subcategory, title, note, date, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        serverId,
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
    const seen = new Set<string>();
    const deduped = expenses.filter(e => {
      const key = e.serverId || e.localId;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const exp of deduped) {
      await this.save(exp);
    }
    await this.deduplicate();
  }

  async deduplicate(): Promise<void> {
    await database.init();
    try {
      await database.db.runAsync(`
        DELETE FROM personal_expenses
        WHERE serverId IS NOT NULL
        AND localId NOT IN (
          SELECT MAX(localId)
          FROM personal_expenses
          WHERE serverId IS NOT NULL
          GROUP BY serverId
        )
      `);
    } catch {}
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

  async delete(localIdOrServerId: string): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'DELETE FROM personal_expenses WHERE localId = ? OR serverId = ?',
      [localIdOrServerId, localIdOrServerId]
    );
  }

  async getPending(): Promise<LocalExpense[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM personal_expenses WHERE syncStatus = ? OR syncStatus = ?',
      ['pending', 'failed']
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

  async markAsSynced(localId: string, serverId: string): Promise<void> {
    await this.update(localId, {
      serverId,
      syncStatus: 'synced',
    });
    await this.deduplicate();
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM personal_expenses');
  }
}

export const expenseRepository = new ExpenseRepository();
