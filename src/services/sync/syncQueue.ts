import { syncRepository, SyncQueueItem } from '../database/repositories/sync.repository';

export class SyncQueue {
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    await syncRepository.enqueue(item);
  }

  async getPendingItems(): Promise<SyncQueueItem[]> {
    return syncRepository.getQueue();
  }

  async removeItem(id: string): Promise<void> {
    await syncRepository.dequeue(id);
  }
}

export const syncQueue = new SyncQueue();
