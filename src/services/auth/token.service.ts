import { storage, STORAGE_KEYS } from '../../config/storage';
import { authService } from '../authService';

class TokenService {
  async getAccessToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setAccessToken(token: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async clearTokens(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async refreshTokens(): Promise<string | null> {
    return authService.refreshToken();
  }
}

export const tokenService = new TokenService();
