import { database } from '../database';
import { GroupExpense } from '../../groupService';

export interface LocalGroupExpense extends GroupExpense {
  localId?: string;
  serverId?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

class GroupExpenseRepository {
  async getAll(groupId?: string): Promise<LocalGroupExpense[]> {
    await database.init();
    let sql = 'SELECT * FROM group_expenses';
    const params: any[] = [];

    if (groupId && groupId !== 'ALL') {
      sql += ' WHERE groupId = ?';
      params.push(groupId);
    }
    sql += ' ORDER BY expenseDate DESC, createdAt DESC';

    const rows = await database.db.getAllAsync<any>(sql, params);

    return rows.map((r) => {
      let parsed: any = null;
      if (r.rawJson) {
        try {
          parsed = JSON.parse(r.rawJson);
        } catch {}
      }

      return {
        id: r.serverId || r.localId,
        localId: r.localId,
        serverId: r.serverId || null,
        groupId: r.groupId,
        amount: Number(r.amount),
        category: r.category,
        subcategory: r.subcategory || null,
        title: r.title || null,
        note: r.note || null,
        expenseDate: r.expenseDate,
        splitType: r.splitType,
        paymentSource: parsed?.paymentSource || parsed?.paidFrom || 'GROUP_FUND',
        paidFrom: parsed?.paidFrom || parsed?.paymentSource || 'GROUP_FUND',
        user: parsed?.user || {
          id: r.userId,
          username: parsed?.user?.username || 'Member',
          name: parsed?.user?.name || null,
        },
        participants: parsed?.participants || [],
        payers: parsed?.payers || [],
        syncStatus: r.syncStatus as any,
        createdAt: r.createdAt,
      };
    });
  }

  async getById(localIdOrServerId: string): Promise<LocalGroupExpense | null> {
    await database.init();
    const row = await database.db.getFirstAsync<any>(
      'SELECT * FROM group_expenses WHERE localId = ? OR serverId = ?',
      [localIdOrServerId, localIdOrServerId]
    );

    if (!row) return null;

    let parsed: any = null;
    if (row.rawJson) {
      try {
        parsed = JSON.parse(row.rawJson);
      } catch {}
    }

    return {
      id: row.serverId || row.localId,
      localId: row.localId,
      serverId: row.serverId || null,
      groupId: row.groupId,
      amount: Number(row.amount),
      category: row.category,
      subcategory: row.subcategory || null,
      title: row.title || null,
      note: row.note || null,
      expenseDate: row.expenseDate,
      splitType: row.splitType,
      paymentSource: parsed?.paymentSource || parsed?.paidFrom || 'GROUP_FUND',
      paidFrom: parsed?.paidFrom || parsed?.paymentSource || 'GROUP_FUND',
      user: parsed?.user || {
        id: row.userId,
        username: parsed?.user?.username || 'Member',
        name: parsed?.user?.name || null,
      },
      participants: parsed?.participants || [],
      payers: parsed?.payers || [],
      syncStatus: row.syncStatus as any,
      createdAt: row.createdAt,
    };
  }

  async save(expense: any, syncStatus = 'pending'): Promise<void> {
    await database.init();
    const serverId =
      expense.serverId ||
      (expense.id && !String(expense.id).startsWith('lge_') && !String(expense.id).startsWith('local_')
        ? String(expense.id)
        : null);

    let localId = expense.localId;
    if (!localId && serverId) {
      const existing = await database.db.getFirstAsync<any>(
        'SELECT localId FROM group_expenses WHERE serverId = ?',
        [serverId],
      );
      if (existing?.localId) {
        localId = existing.localId;
      }
    }

    if (!localId) {
      localId = `lge_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    }

    if (serverId && expense.localId) {
      await database.db.runAsync(
        'DELETE FROM group_expenses WHERE localId != ? AND serverId = ?',
        [localId, serverId],
      );
    }

    const userId = expense.userId || expense.user?.id || '';

    await database.db.runAsync(
      `INSERT OR REPLACE INTO group_expenses (
        localId, serverId, groupId, userId, amount, category, subcategory, title, note, expenseDate, splitType, status, rawJson, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        serverId,
        expense.groupId,
        userId,
        Number(expense.amount),
        expense.category,
        expense.subcategory || null,
        expense.title || null,
        expense.note || null,
        expense.expenseDate || expense.date || new Date().toISOString(),
        expense.splitType || 'EQUAL',
        expense.status || 'ACTIVE',
        JSON.stringify(expense),
        syncStatus,
        expense.createdAt || new Date().toISOString(),
        expense.updatedAt || new Date().toISOString(),
      ],
    );
  }

  async saveAll(expenses: any[]): Promise<void> {
    await database.init();
    for (const exp of expenses) {
      await this.save(exp, 'synced');
    }
    await this.deduplicate();
  }

  async deduplicate(): Promise<void> {
    await database.init();
    try {
      await database.db.runAsync(`
        DELETE FROM group_expenses
        WHERE serverId IS NOT NULL
        AND localId NOT IN (
          SELECT MAX(localId)
          FROM group_expenses
          WHERE serverId IS NOT NULL
          GROUP BY serverId
        )
      `);
    } catch {}
  }

  async delete(localIdOrServerId: string): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'DELETE FROM group_expenses WHERE localId = ? OR serverId = ?',
      [localIdOrServerId, localIdOrServerId],
    );
  }

  async getPending(): Promise<LocalGroupExpense[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM group_expenses WHERE syncStatus = ? OR syncStatus = ?',
      ['pending', 'failed']
    );

    return rows.map((r) => {
      let parsed: any = null;
      if (r.rawJson) {
        try {
          parsed = JSON.parse(r.rawJson);
        } catch {}
      }
      return {
        id: r.serverId || r.localId,
        localId: r.localId,
        serverId: r.serverId || null,
        groupId: r.groupId,
        amount: Number(r.amount),
        category: r.category,
        subcategory: r.subcategory || null,
        title: r.title || null,
        note: r.note || null,
        expenseDate: r.expenseDate,
        splitType: r.splitType,
        paymentSource: parsed?.paymentSource || parsed?.paidFrom || 'GROUP_FUND',
        paidFrom: parsed?.paidFrom || parsed?.paymentSource || 'GROUP_FUND',
        user: parsed?.user || { id: r.userId, username: 'Member' },
        participants: parsed?.participants || [],
        payers: parsed?.payers || [],
        syncStatus: r.syncStatus as any,
        createdAt: r.createdAt,
      };
    });
  }

  async markAsSynced(localId: string, serverId: string): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'UPDATE group_expenses SET serverId = ?, syncStatus = ? WHERE localId = ?',
      [serverId, 'synced', localId]
    );
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM group_expenses');
  }
}

export const groupExpenseRepository = new GroupExpenseRepository();
