import { databaseConfig } from './databaseConfig';

class AppDatabase {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    // Database initialization logic (e.g. SQLite, WatermelonDB, or Realm)
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    this.isInitialized = false;
  }
}

export const database = new AppDatabase();
