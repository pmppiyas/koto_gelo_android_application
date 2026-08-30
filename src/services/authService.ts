import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';
import { SignInPayload, SignUpPayload, User } from '../features/auth/auth.types';

export const authService = {
  async signin(payload: SignInPayload): Promise<{ user: User; token: string }> {
    const res = await fetch(API_ENDPOINTS.AUTH.SIGNIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.message || 'Sign in failed. Please check credentials.');
    }

    const token = json?.data?.accessToken || 'token_' + Date.now();
    const refreshToken = json?.data?.refreshToken;
    const user: User = json?.data?.user || {
      id: json?.data?.id || 'usr_' + Date.now(),
      username: payload.username,
      name: payload.username,
    };

    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) {
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user, token };
  },

  async signup(payload: SignUpPayload): Promise<{ user: User; token: string }> {
    const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.message || 'Registration failed.');
    }

    const token = json?.data?.accessToken || 'token_' + Date.now();
    const refreshToken = json?.data?.refreshToken;
    const user: User = json?.data?.user || {
      id: json?.data?.id || 'usr_' + Date.now(),
      username: payload.username,
      name: payload.name || payload.username,
      email: payload.email,
    };

    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) {
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user, token };
  },

  async refreshToken(): Promise<string | null> {
    const storedRefreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedRefreshToken) return null;

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedRefreshToken}`,
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
        credentials: 'include',
      });

      const json = await res.json().catch(() => null);

      if (res.ok && (json?.data?.accessToken || json?.accessToken)) {
        const newAccessToken = json?.data?.accessToken || json?.accessToken;
        const newRefreshToken =
          json?.data?.refreshToken || json?.refreshToken || storedRefreshToken;

        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);
        await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        return newAccessToken;
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER);
  },

  async getStoredToken(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await storage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
