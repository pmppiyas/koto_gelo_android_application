import { storage } from '../../config/storage';

export interface SQLiteAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

class CrossPlatformSQLiteAdapter implements SQLiteAdapter {
  private db: any = null;
  private isNativeSQLite = false;
  private memoryStore: Map<string, any[]> = new Map();
  private storageKeyPrefix = 'kotogelo_sqlite_table_';
  private initPromise: Promise<void> | null = null;

  async init(dbName = 'kotogelo.db'): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Dynamic import to support both native Expo SQLite and fallback environments
        const ExpoSQLite = await import('expo-sqlite');
        if (ExpoSQLite && typeof ExpoSQLite.openDatabaseAsync === 'function') {
          this.db = await ExpoSQLite.openDatabaseAsync(dbName);
          this.isNativeSQLite = true;
          return;
        }
      } catch {
        // Native SQLite not available (e.g. web or test runner) -> use storage-backed fallback
        this.isNativeSQLite = false;
      }

      // Load tables from storage for fallback
      await this.loadFallbackFromStorage();
    })();

    await this.initPromise;
  }

  private async loadFallbackFromStorage(): Promise<void> {
    try {
      const tableNames = [
        'personal_expenses',
        'groups',
        'group_members',
        'group_expenses',
        'group_deposits',
        'group_invitations',
        'sync_queue',
      ];
      for (const name of tableNames) {
        const raw = await storage.getItem(this.storageKeyPrefix + name);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              this.memoryStore.set(name, parsed);
            }
          } catch {}
        }
        if (!this.memoryStore.has(name)) {
          this.memoryStore.set(name, []);
        }
      }
    } catch {}
  }

  private async persistFallbackTable(tableName: string): Promise<void> {
    try {
      const records = this.memoryStore.get(tableName) || [];
      await storage.setItem(this.storageKeyPrefix + tableName, JSON.stringify(records));
    } catch {}
  }

  async execAsync(sql: string): Promise<void> {
    if (this.isNativeSQLite && this.db) {
      try {
        return await this.db.execAsync(sql);
      } catch (err) {
        console.warn('Native SQLite execAsync warning:', err);
      }
    }
    const tableMatches = sql.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)/gi);
    for (const match of tableMatches) {
      const tableName = match[1];
      if (!this.memoryStore.has(tableName)) {
        this.memoryStore.set(tableName, []);
      }
    }
  }

  async runAsync(
    sql: string,
    params: any[] = [],
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const safeParams = (params || []).map((p) =>
      p === undefined || p === null ? null : typeof p === 'object' ? JSON.stringify(p) : p,
    );

    if (this.isNativeSQLite && this.db) {
      try {
        if (safeParams.length > 0) {
          return await this.db.runAsync(sql, ...safeParams);
        }
        return await this.db.runAsync(sql);
      } catch (err) {
        console.warn('Native SQLite runAsync warning, fallback to memory:', err);
      }
    }

    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('INSERT INTO') || trimmed.startsWith('INSERT OR REPLACE INTO')) {
      const tableMatch = sql.match(/INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const columns = tableMatch[2].split(',').map((c) => c.trim());
        const row: Record<string, any> = {};
        columns.forEach((col, idx) => {
          row[col] = safeParams[idx] !== undefined ? safeParams[idx] : null;
        });

        const list = this.memoryStore.get(tableName) || [];
        const primaryKey = columns[0]; // localId or id
        const existingIdx = list.findIndex((item) => item[primaryKey] === row[primaryKey]);

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...row };
        } else {
          list.push(row);
        }

        this.memoryStore.set(tableName, list);
        await this.persistFallbackTable(tableName);
        return { lastInsertRowId: Date.now(), changes: 1 };
      }
    } else if (trimmed.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const list = this.memoryStore.get(tableName) || [];
        const whereClause = tableMatch[3];
        const whereParam = safeParams[safeParams.length - 1];

        let changes = 0;
        const updated = list.map((item) => {
          const match =
            (whereClause.includes('localId') && item.localId === whereParam) ||
            (whereClause.includes('id') && item.id === whereParam) ||
            (whereClause.includes('groupId') && item.groupId === whereParam);

          if (match) {
            changes++;
            const setAssignments = tableMatch[2].split(',').map((s) => s.trim());
            const newValues: Record<string, any> = {};
            setAssignments.forEach((assign, idx) => {
              const colName = assign.split('=')[0].trim();
              if (safeParams[idx] !== undefined) {
                newValues[colName] = safeParams[idx];
              }
            });
            return { ...item, ...newValues };
          }
          return item;
        });

        if (changes > 0) {
          this.memoryStore.set(tableName, updated);
          await this.persistFallbackTable(tableName);
        }
        return { lastInsertRowId: 0, changes };
      }
    } else if (trimmed.startsWith('DELETE')) {
      const tableMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        if (!tableMatch[2]) {
          // DELETE FROM table (clear all)
          this.memoryStore.set(tableName, []);
          await this.persistFallbackTable(tableName);
          return { lastInsertRowId: 0, changes: 1 };
        }
        const whereClause = tableMatch[2];
        const list = this.memoryStore.get(tableName) || [];
        const filtered = list.filter((item) => {
          if (whereClause.includes('localId = ?') && item.localId === safeParams[0]) return false;
          if (whereClause.includes('id = ?') && item.id === safeParams[0]) return false;
          if (whereClause.includes('groupId = ?') && item.groupId === safeParams[0]) return false;
          return true;
        });
        this.memoryStore.set(tableName, filtered);
        await this.persistFallbackTable(tableName);
        return { lastInsertRowId: 0, changes: list.length - filtered.length };
      }
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const safeParams = (params || []).map((p) =>
      p === undefined || p === null ? null : typeof p === 'object' ? JSON.stringify(p) : p,
    );

    if (this.isNativeSQLite && this.db) {
      try {
        if (safeParams.length > 0) {
          return await this.db.getAllAsync(sql, ...safeParams);
        }
        return await this.db.getAllAsync(sql);
      } catch (err) {
        console.warn('Native SQLite getAllAsync warning, fallback to memory:', err);
      }
    }

    const tableMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) return [];

    const tableName = tableMatch[1];
    let list = [...(this.memoryStore.get(tableName) || [])];

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch && safeParams.length > 0) {
      const whereClause = whereMatch[1];
      const conditions = Array.from(
        whereClause.matchAll(/([a-zA-Z0-9_]+)\s*(=|!=|<>)\s*\?/g),
      );

      list = list.filter((item) => {
        for (let idx = 0; idx < conditions.length; idx++) {
          const colName = conditions[idx][1];
          const op = conditions[idx][2];
          const paramVal = safeParams[idx];
          if (paramVal === undefined) continue;

          const itemVal = item[colName];
          if (op === '=' && itemVal != paramVal) return false;
          if ((op === '!=' || op === '<>') && itemVal == paramVal) return false;
        }
        return true;
      });
    }

    if (sql.includes('ORDER BY')) {
      if (
        sql.includes('date DESC') ||
        sql.includes('createdAt DESC') ||
        sql.includes('depositDate DESC') ||
        sql.includes('expenseDate DESC')
      ) {
        list.sort((a, b) => {
          const tA = new Date(a.date || a.expenseDate || a.depositDate || a.createdAt || 0).getTime();
          const tB = new Date(b.date || b.expenseDate || b.depositDate || b.createdAt || 0).getTime();
          return tB - tA;
        });
      }
    }

    return list as T[];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const safeParams = (params || []).map((p) =>
      p === undefined || p === null ? null : typeof p === 'object' ? JSON.stringify(p) : p,
    );

    if (this.isNativeSQLite && this.db) {
      try {
        if (safeParams.length > 0) {
          return await this.db.getFirstAsync(sql, ...safeParams);
        }
        return await this.db.getFirstAsync(sql);
      } catch (err) {
        console.warn('Native SQLite getFirstAsync warning, fallback to memory:', err);
      }
    }

    const all = await this.getAllAsync<T>(sql, safeParams);
    return all.length > 0 ? all[0] : null;
  }
}

export const sqliteAdapter = new CrossPlatformSQLiteAdapter();
