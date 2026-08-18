import { tokenService } from './token.service';
import { localStorage } from '../storage/localStorage';
import { STORAGE_KEYS } from '../storage/storageKeys';

class SessionService {
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenService.getAccessToken();
    return !!token;
  }

  async clearSession(): Promise<void> {
    await tokenService.clearTokens();
    await localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export const sessionService = new SessionService();
