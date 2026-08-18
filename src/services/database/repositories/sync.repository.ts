export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'EXPENSE' | 'GROUP' | 'SETTLEMENT';
  payload: any;
  retryCount: number;
  createdAt: string;
}

class SyncRepository {
  async getQueue(): Promise<SyncQueueItem[]> {
    return [];
  }

  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>,
  ): Promise<void> {}

  async dequeue(id: string): Promise<void> {}
}

export const syncRepository = new SyncRepository();
