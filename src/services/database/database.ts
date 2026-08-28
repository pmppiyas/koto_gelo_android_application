import { sqliteAdapter, SQLiteAdapter } from './sqliteAdapter';
import { databaseConfig } from './databaseConfig';

class AppDatabase {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private adapter: SQLiteAdapter = sqliteAdapter;

  get db(): SQLiteAdapter {
    return this.adapter;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        await (this.adapter as any).init(databaseConfig.name);

      // Create Personal Expenses Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS personal_expenses (
          localId TEXT PRIMARY KEY,
          serverId TEXT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          subcategory TEXT,
          title TEXT,
          note TEXT,
          date TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Create Groups Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          createdById TEXT NOT NULL,
          rawJson TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'synced',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Create Group Members Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS group_members (
          id TEXT PRIMARY KEY,
          groupId TEXT NOT NULL,
          userId TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'MEMBER',
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          rawJson TEXT,
          joinedAt TEXT
        );
      `);

      // Create Group Expenses Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS group_expenses (
          localId TEXT PRIMARY KEY,
          serverId TEXT,
          groupId TEXT NOT NULL,
          userId TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          subcategory TEXT,
          title TEXT,
          note TEXT,
          expenseDate TEXT NOT NULL,
          splitType TEXT NOT NULL DEFAULT 'EQUAL',
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          rawJson TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Create Group Deposits Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS group_deposits (
          localId TEXT PRIMARY KEY,
          serverId TEXT,
          groupId TEXT NOT NULL,
          userId TEXT NOT NULL,
          recordedById TEXT NOT NULL,
          amount REAL NOT NULL,
          depositDate TEXT NOT NULL,
          method TEXT NOT NULL DEFAULT 'CASH',
          note TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          rawJson TEXT,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Create Group Invitations Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS group_invitations (
          id TEXT PRIMARY KEY,
          groupId TEXT NOT NULL,
          invitedById TEXT NOT NULL,
          inviteeId TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          rawJson TEXT,
          createdAt TEXT NOT NULL
        );
      `);

      // Create Sync Queue Table
      await this.adapter.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          entityType TEXT NOT NULL,
          payload TEXT NOT NULL,
          retryCount INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending',
          error TEXT,
          createdAt TEXT NOT NULL
        );
      `);

      // Deduplicate any existing duplicate rows from previous versions
      try {
        await this.adapter.execAsync(`
          DELETE FROM personal_expenses
          WHERE serverId IS NOT NULL
          AND localId NOT IN (
            SELECT MAX(localId)
            FROM personal_expenses
            WHERE serverId IS NOT NULL
            GROUP BY serverId
          );

          DELETE FROM group_deposits
          WHERE serverId IS NOT NULL
          AND localId NOT IN (
            SELECT MAX(localId)
            FROM group_deposits
            WHERE serverId IS NOT NULL
            GROUP BY serverId
          );

          DELETE FROM group_expenses
          WHERE serverId IS NOT NULL
          AND localId NOT IN (
            SELECT MAX(localId)
            FROM group_expenses
            WHERE serverId IS NOT NULL
            GROUP BY serverId
          );
        `);
      } catch {}

        this.isInitialized = true;
      } catch (err) {
        console.warn('Database initialization warning:', err);
        this.isInitialized = true;
      } finally {
        this.initPromise = null;
      }
    })();

    await this.initPromise;
  }

  async clearAllData(): Promise<void> {
    try {
      await this.init();
      const tables = [
        'personal_expenses',
        'groups',
        'group_members',
        'group_expenses',
        'group_deposits',
        'group_invitations',
        'sync_queue',
      ];
      await Promise.allSettled(
        tables.map(t => this.adapter.runAsync(`DELETE FROM ${t}`).catch(() => {}))
      );
    } catch (err) {
      console.warn('Error clearing database tables:', err);
    }
  }

  async close(): Promise<void> {
    this.isInitialized = false;
  }
}

export const database = new AppDatabase();
