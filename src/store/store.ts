import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authReducer, initialAuthState, AuthAction } from './authSlice';
import { expenseReducer, initialExpenseState } from './expenseSlice';
import { AuthState } from './auth.types';
import { ExpenseState, ExpenseAction } from './expense.types';
import { authService } from '../services/authService';
import { expenseService } from '../services/expenseService';
import { localExpenseService } from '../services/localExpenseService';
import { expenseSyncService } from '../services/expenseSyncService';
import { database } from '../services/database/database';
import { storage, STORAGE_KEYS } from '../config/storage';
import { API_ENDPOINTS } from '../config/api';
import { onUnauthorized } from '../utils/authEvents';
import { getLocalDateString } from '../utils/date';

export interface RootState {
  auth: AuthState;
  expenses: ExpenseState;
}

export type RootAction = AuthAction | ExpenseAction;

interface StoreContextType {
  state: RootState;
  dispatch: React.Dispatch<RootAction>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

async function verifyToken(token: string): Promise<'valid' | 'invalid' | 'offline'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(API_ENDPOINTS.USER.ME, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok ? 'valid' : 'invalid';
  } catch {
    // Network error / timeout / server down → treat as offline, keep user logged in
    return 'offline';
  }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [expenseState, expenseDispatch] = useReducer(expenseReducer, initialExpenseState);

  const combinedDispatch: React.Dispatch<RootAction> = (action: RootAction) => {
    if (action.type.startsWith('auth/')) {
      authDispatch(action as AuthAction);
    } else if (action.type.startsWith('expenses/')) {
      expenseDispatch(action as ExpenseAction);
    }
  };

  useEffect(() => {
    // Subscribe to global unauthorized events (e.g. 401 or token expired)
    const unsubscribe = onUnauthorized(() => {
      authDispatch({ type: 'auth/logout' });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Initialize SQLite Database Tables
        await database.init();

        // 2. Check for stored token FIRST (don't load data before user verification)
        const token = await authService.getStoredToken();

        if (!token) {
          // No token → clear any stale data from previous session
          await database.clearAllData().catch(() => {});
          authDispatch({ type: 'auth/setLoading', payload: false });
          return;
        }

        const tokenStatus = await verifyToken(token);

        if (tokenStatus === 'invalid') {
          // Token is definitely rejected by server → logout & clear stale data
          await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storage.removeItem(STORAGE_KEYS.USER);
          await database.clearAllData().catch(() => {});
          authDispatch({ type: 'auth/logout' });
          return;
        }

        // 'valid' or 'offline' → keep user logged in
        const user = await authService.getStoredUser();

        // 3. NOW load local data for this verified user
        const localExpenses = await localExpenseService.getLocalExpenses();
        expenseDispatch({ type: 'expenses/setExpenses', payload: localExpenses });

        authDispatch({
          type: 'auth/setTokenOnly',
          payload: { token, user },
        });

        if (tokenStatus === 'valid') {
          // Sync pending items from SQLite queue
          await expenseSyncService.syncPendingExpenses(combinedDispatch);
          // Pull latest remote data in background to refresh SQLite
          await expenseSyncService.pullLatestRemoteData();

          try {
            const res = await expenseService.getPersonalExpenses({ limit: 100 });
            const serverExpenses =
              res?.expenses ||
              res?.data?.expenses ||
              (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
            if (Array.isArray(serverExpenses)) {
              const todayStr = getLocalDateString();
              const serverMapped = serverExpenses.map((se: any) => {
                let formattedDate = todayStr;
                try {
                  const rawDate = se.expenseDate || se.date || se.createdAt;
                  if (rawDate) {
                    const parsed = new Date(rawDate);
                    if (!isNaN(parsed.getTime())) {
                      formattedDate = getLocalDateString(parsed);
                    }
                  }
                } catch {}

                return {
                  localId: `srv_${se.id}`,
                  serverId: se.id,
                  amount: Number(se.amount),
                  category: se.category,
                  subcategory: se.subcategory || null,
                  title: se.title || null,
                  date: formattedDate,
                  note: se.note || null,
                  syncStatus: 'synced' as const,
                  type: 'PERSONAL' as const,
                  groupId: se.groupId || null,
                  createdAt: se.createdAt,
                  updatedAt: se.updatedAt || se.createdAt,
                };
              });
              const currentLocal = await localExpenseService.getLocalExpenses();
              const pendingItems = currentLocal.filter(
                (e) => e.syncStatus === 'pending' || e.syncStatus === 'failed'
              );
              const seen = new Set<string>();
              const reconciled: any[] = [];
              [...pendingItems, ...serverMapped].forEach((item) => {
                const k = item.serverId || item.localId;
                if (k && !seen.has(k)) {
                  seen.add(k);
                  reconciled.push(item);
                }
              });
              await localExpenseService.setLocalExpenses(reconciled);
              expenseDispatch({ type: 'expenses/setExpenses', payload: reconciled });
            }
          } catch {}
        }
      } catch {
        authDispatch({ type: 'auth/setLoading', payload: false });
      }
    };

    initializeApp();
  }, []);

  const state: RootState = {
    auth: authState,
    expenses: expenseState,
  };

  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch: combinedDispatch } },
    children
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
