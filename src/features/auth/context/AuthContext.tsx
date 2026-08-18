import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { authApi } from '../api/auth.api';
import {
  SignInCredentials,
  SignUpCredentials,
  UserData,
  AuthResponse,
} from '../types/auth.types';
import { tokenService } from '../../../services/auth/token.service';
import { localStorage } from '../../../services/storage/localStorage';
import { STORAGE_KEYS } from '../../../services/storage/storageKeys';

export interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  signin: (credentials: SignInCredentials) => Promise<AuthResponse>;
  signup: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await tokenService.getAccessToken();
        const storedUser = await localStorage.getItem(STORAGE_KEYS.USER);
        if (token) {
          setIsAuthenticated(true);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signin = useCallback(async (credentials: SignInCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.signin(credentials);
      if (res.data?.accessToken) {
        await tokenService.setAccessToken(res.data.accessToken);
      }
      if (res.data?.refreshToken) {
        await tokenService.setRefreshToken(res.data.refreshToken);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        await localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(res.data.user),
        );
      }
      setIsAuthenticated(true);
      return res;
    } catch (err: any) {
      const msg = err.message || 'Signin failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.signup(credentials);
      if (res.data?.accessToken) {
        await tokenService.setAccessToken(res.data.accessToken);
      }
      if (res.data?.refreshToken) {
        await tokenService.setRefreshToken(res.data.refreshToken);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        await localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(res.data.user),
        );
      }
      setIsAuthenticated(true);
      return res;
    } catch (err: any) {
      const msg = err.message || 'Signup failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (e) {
    } finally {
      await tokenService.clearTokens();
      await localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        setError,
        signin,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
