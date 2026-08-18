import { syncQueue } from './syncQueue';
import { SyncQueueItem } from '../database/repositories/sync.repository';

export class SyncProcessor {
  async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      await syncQueue.removeItem(item.id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async processAll(): Promise<void> {
    const items = await syncQueue.getPendingItems();
    for (const item of items) {
      await this.processItem(item);
    }
  }
}

export const syncProcessor = new SyncProcessor();
