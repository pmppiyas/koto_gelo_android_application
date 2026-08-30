import { storage } from '../../config/storage';

class LocalStorage {
  async getItem(key: string): Promise<string | null> {
    return storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return storage.removeItem(key);
  }

  async clear(): Promise<void> {
    return storage.clear();
  }
}

export const localStorage = new LocalStorage();
