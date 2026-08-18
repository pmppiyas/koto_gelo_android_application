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

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    // Save to local offline queue table
  }

  async dequeue(id: string): Promise<void> {
    // Remove from local offline queue table
  }
}

export const syncRepository = new SyncRepository();
