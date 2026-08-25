import { database } from '../database';

export interface SyncQueueItem {
  id: string;
  action:
    | 'CREATE_PERSONAL_EXPENSE'
    | 'UPDATE_PERSONAL_EXPENSE'
    | 'DELETE_PERSONAL_EXPENSE'
    | 'CREATE_GROUP'
    | 'UPDATE_GROUP'
    | 'DELETE_GROUP'
    | 'CREATE_GROUP_EXPENSE'
    | 'DELETE_GROUP_EXPENSE'
    | 'CREATE_GROUP_DEPOSIT'
    | 'UPDATE_GROUP_DEPOSIT'
    | 'DELETE_GROUP_DEPOSIT'
    | 'SETTLE_PAYMENT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE';
  entityType: 'EXPENSE' | 'GROUP' | 'DEPOSIT' | 'SETTLEMENT';
  payload: any;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed' | 'synced';
  error?: string | null;
  createdAt: string;
}

class SyncRepository {
  async getQueue(): Promise<SyncQueueItem[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      "SELECT * FROM sync_queue WHERE status = 'pending' OR status = 'failed' ORDER BY createdAt ASC"
    );

    return rows.map((r) => {
      let parsedPayload: any = {};
      try {
        parsedPayload = JSON.parse(r.payload);
      } catch {}

      return {
        id: r.id,
        action: r.action as any,
        entityType: r.entityType as any,
        payload: parsedPayload,
        retryCount: Number(r.retryCount) || 0,
        status: r.status as any,
        error: r.error || null,
        createdAt: r.createdAt,
      };
    });
  }

  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<string> {
    await database.init();
    const id = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const createdAt = new Date().toISOString();

    await database.db.runAsync(
      `INSERT INTO sync_queue (
        id, action, entityType, payload, retryCount, status, error, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.action,
        item.entityType,
        JSON.stringify(item.payload),
        0,
        'pending',
        null,
        createdAt,
      ]
    );

    return id;
  }

  async dequeue(id: string): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'in_progress' | 'failed' | 'synced',
    error?: string
  ): Promise<void> {
    await database.init();
    await database.db.runAsync(
      'UPDATE sync_queue SET status = ?, error = ?, retryCount = retryCount + 1 WHERE id = ?',
      [status, error || null, id]
    );
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM sync_queue');
  }
}

export const syncRepository = new SyncRepository();
