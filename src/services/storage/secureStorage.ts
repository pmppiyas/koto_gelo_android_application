import { storage } from '../../config/storage';

class SecureStorage {
  async getItem(key: string): Promise<string | null> {
    return storage.getItem(`secure_${key}`);
  }

  async setItem(key: string, value: string): Promise<void> {
    return storage.setItem(`secure_${key}`, value);
  }

  async removeItem(key: string): Promise<void> {
    return storage.removeItem(`secure_${key}`);
  }
}

export const secureStorage = new SecureStorage();
