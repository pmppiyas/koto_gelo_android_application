// Secure storage wrapper (can be backed by react-native-keychain or expo-secure-store)
import { localStorage } from './localStorage';

class SecureStorage {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(`secure_${key}`);
  }

  async setItem(key: string, value: string): Promise<void> {
    return localStorage.setItem(`secure_${key}`, value);
  }

  async removeItem(key: string): Promise<void> {
    return localStorage.removeItem(`secure_${key}`);
  }
}

export const secureStorage = new SecureStorage();
