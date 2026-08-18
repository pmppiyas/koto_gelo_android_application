import { secureStorage } from '../storage/secureStorage';
import { STORAGE_KEYS } from '../storage/storageKeys';

class TokenService {
  async getAccessToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async setAccessToken(token: string): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async clearTokens(): Promise<void> {
    await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

export const tokenService = new TokenService();
