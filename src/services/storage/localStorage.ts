class LocalStorage {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const localStorage = new LocalStorage();
