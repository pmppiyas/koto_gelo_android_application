type NetworkListener = (isConnected: boolean) => void;

class NetworkMonitor {
  private listeners: Set<NetworkListener> = new Set();
  private isConnected: boolean = true;

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): boolean {
    return this.isConnected;
  }

  updateStatus(status: boolean): void {
    this.isConnected = status;
    this.listeners.forEach(fn => fn(status));
  }
}

export const networkMonitor = new NetworkMonitor();
