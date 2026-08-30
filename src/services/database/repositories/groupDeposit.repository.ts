import { database } from '../database';
import { GroupDeposit } from '../../groupService';

export interface LocalGroupDeposit extends GroupDeposit {
  localId?: string;
  serverId?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

class GroupDepositRepository {
  async getAll(groupId?: string): Promise<LocalGroupDeposit[]> {
    await database.init();
    let sql = 'SELECT * FROM group_deposits';
    const params: any[] = [];

    if (groupId && groupId !== 'ALL') {
      sql += ' WHERE groupId = ?';
      params.push(groupId);
    }
    sql += ' ORDER BY depositDate DESC, createdAt DESC';

    const rows = await database.db.getAllAsync<any>(sql, params);
    const memberRows = await database.db.getAllAsync<any>('SELECT * FROM group_members');
    const memberMap = new Map<string, any>();
    memberRows.forEach((m) => {
      if (m.rawJson) {
        try {
          const parsed = JSON.parse(m.rawJson);
          if (parsed.user && parsed.user.username) {
            memberMap.set(m.userId, parsed.user);
          } else if (parsed.username) {
            memberMap.set(m.userId, parsed);
          }
        } catch {}
      }
    });

    return rows.map((r) => {
      let parsed: any = null;
      if (r.rawJson) {
        try {
          parsed = JSON.parse(r.rawJson);
        } catch {}
      }

      const memberUser = memberMap.get(r.userId) || memberMap.get(r.recordedById);
      const resolvedUser =
        (parsed?.user?.username && parsed.user.username !== 'Member' ? parsed.user : null) ||
        (memberUser?.username && memberUser.username !== 'Member' ? memberUser : null) ||
        parsed?.user ||
        memberUser || {
          id: r.userId,
          username: '',
          name: null,
          avatarUrl: null,
        };

      return {
        id: r.serverId || r.localId,
        localId: r.localId,
        serverId: r.serverId || null,
        groupId: r.groupId,
        userId: r.userId,
        recordedById: r.recordedById,
        amount: Number(r.amount),
        depositDate: r.depositDate,
        method: r.method as any,
        note: r.note || null,
        expenseId: parsed?.expenseId || null,
        status: r.status as any,
        user: resolvedUser,
        recordedBy: parsed?.recordedBy || {
          id: r.recordedById,
          username: '',
          name: null,
        },
        group: parsed?.group,
        syncStatus: r.syncStatus as any,
        createdAt: r.createdAt,
      };
    });
  }

  async getById(localIdOrServerId: string): Promise<LocalGroupDeposit | null> {
    await database.init();
    const row = await database.db.getFirstAsync<any>(
      'SELECT * FROM group_deposits WHERE localId = ? OR serverId = ?',
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
      userId: row.userId,
      recordedById: row.recordedById,
      amount: Number(row.amount),
      depositDate: row.depositDate,
      method: row.method as any,
      note: row.note || null,
      expenseId: parsed?.expenseId || null,
      status: row.status as any,
      user: parsed?.user || {
        id: row.userId,
        username: parsed?.user?.username || 'Member',
        name: parsed?.user?.name || null,
      },
      recordedBy: parsed?.recordedBy,
      group: parsed?.group,
      syncStatus: row.syncStatus as any,
      createdAt: row.createdAt,
    };
  }

  async save(deposit: any, syncStatus = 'pending'): Promise<void> {
    await database.init();
    const serverId =
      deposit.serverId ||
      (deposit.id && !String(deposit.id).startsWith('lgd_') ? String(deposit.id) : null);

    let localId = deposit.localId;
    if (!localId && serverId) {
      const existing = await database.db.getFirstAsync<any>(
        'SELECT localId FROM group_deposits WHERE serverId = ?',
        [serverId],
      );
      if (existing?.localId) {
        localId = existing.localId;
      }
    }

    if (!localId) {
      localId = `lgd_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    }

    // Clean up duplicate pending rows for this serverId if any
    if (serverId && deposit.localId) {
      await database.db.runAsync(
        'DELETE FROM group_deposits WHERE localId != ? AND serverId = ?',
        [localId, serverId],
      );
    }

    await database.db.runAsync(
      `INSERT OR REPLACE INTO group_deposits (
        localId, serverId, groupId, userId, recordedById, amount, depositDate, method, note, status, rawJson, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        serverId,
        deposit.groupId,
        deposit.userId,
        deposit.recordedById || deposit.userId,
        Number(deposit.amount),
        deposit.depositDate || new Date().toISOString(),
        deposit.method || 'CASH',
        deposit.note || null,
        deposit.status || 'ACTIVE',
        JSON.stringify(deposit),
        syncStatus,
        deposit.createdAt || new Date().toISOString(),
        deposit.updatedAt || new Date().toISOString(),
      ],
    );
  }

  async saveAll(deposits: any[]): Promise<void> {
    await database.init();
    for (const dep of deposits) {
      await this.save(dep, 'synced');
    }
    await this.deduplicate();
  }

  async deduplicate(): Promise<void> {
    await database.init();
    try {
      await database.db.runAsync(`
        DELETE FROM group_deposits
        WHERE serverId IS NOT NULL
        AND localId NOT IN (
          SELECT MAX(localId)
          FROM group_deposits
          WHERE serverId IS NOT NULL
          GROUP BY serverId
        )
      `);
    } catch {}
  }

  async delete(localIdOrServerId: string): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'DELETE FROM group_deposits WHERE localId = ? OR serverId = ?',
      [localIdOrServerId, localIdOrServerId],
    );
  }

  async getPending(): Promise<LocalGroupDeposit[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM group_deposits WHERE syncStatus = ? OR syncStatus = ?',
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
        userId: r.userId,
        recordedById: r.recordedById,
        amount: Number(r.amount),
        depositDate: r.depositDate,
        method: r.method as any,
        note: r.note || null,
        expenseId: parsed?.expenseId || null,
        status: r.status as any,
        user: parsed?.user || { id: r.userId, username: 'Member' },
        recordedBy: parsed?.recordedBy,
        group: parsed?.group,
        syncStatus: r.syncStatus as any,
        createdAt: r.createdAt,
      };
    });
  }

  async markAsSynced(localId: string, serverId: string): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'UPDATE group_deposits SET serverId = ?, syncStatus = ? WHERE localId = ?',
      [serverId, 'synced', localId]
    );
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM group_deposits');
  }
}

export const groupDepositRepository = new GroupDepositRepository();
