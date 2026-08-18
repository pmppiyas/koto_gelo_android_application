import { syncProcessor } from './syncProcessor';
import { networkMonitor } from './networkMonitor';
import { appConfig } from '../../config/app.config';

export class SyncManager {
  private syncTimer: any = null;

  start(): void {
    networkMonitor.subscribe(isConnected => {
      if (isConnected) {
        this.triggerSync();
      }
    });

    this.syncTimer = setInterval(() => {
      if (networkMonitor.getStatus()) {
        this.triggerSync();
      }
    }, appConfig.sync.intervalMs);
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async triggerSync(): Promise<void> {
    await syncProcessor.processAll();
  }
}

export const syncManager = new SyncManager();
