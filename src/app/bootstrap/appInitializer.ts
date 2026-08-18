import { database } from '../../services/database/database';
import { syncManager } from '../../services/sync/syncManager';

export const appInitializer = {
  async init(): Promise<void> {
    await database.init();

    syncManager.start();
  },
};
