import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authReducer, initialAuthState, AuthAction } from './authSlice';
import { expenseReducer, initialExpenseState } from './expenseSlice';
import { AuthState } from './auth.types';
import { ExpenseState, ExpenseAction, LocalExpense } from './expense.types';
import { authService } from '../services/authService';
import { expenseService } from '../services/expenseService';
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

async function verifyToken(token: string): Promise<{ status: 'valid' | 'invalid' | 'offline'; token?: string }> {
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
    if (res.ok) return { status: 'valid', token };

    if (res.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        return { status: 'valid', token: newToken };
      }
      return { status: 'invalid' };
    }

    return { status: 'invalid' };
  } catch {
    return { status: 'offline', token };
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
    const unsubscribe = onUnauthorized(() => {
      authDispatch({ type: 'auth/logout' });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await authService.getStoredToken();

        if (!token) {
          authDispatch({ type: 'auth/setLoading', payload: false });
          return;
        }

        const tokenResult = await verifyToken(token);
        const activeToken = tokenResult.token || token;

        if (tokenResult.status === 'invalid') {
          await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          await storage.removeItem(STORAGE_KEYS.USER);
          authDispatch({ type: 'auth/logout' });
          return;
        }

        const user = await authService.getStoredUser();

        authDispatch({
          type: 'auth/setTokenOnly',
          payload: { token: activeToken, user },
        });

        if (tokenResult.status === 'valid') {
          try {
            const res = await expenseService.getPersonalExpenses({ limit: 100 });
            const serverExpenses =
              res?.expenses ||
              res?.data?.expenses ||
              (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
            if (Array.isArray(serverExpenses)) {
              const todayStr = getLocalDateString();
              const serverMapped: LocalExpense[] = serverExpenses.map((se: any) => {
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
                  id: se.id,
                  localId: se.id,
                  amount: Number(se.amount),
                  category: se.category,
                  subcategory: se.subcategory || null,
                  title: se.title || null,
                  date: formattedDate,
                  note: se.note || null,
                  type: 'PERSONAL',
                  groupId: se.groupId || null,
                  createdAt: se.createdAt,
                  updatedAt: se.updatedAt || se.createdAt,
                };
              });
              expenseDispatch({ type: 'expenses/setExpenses', payload: serverMapped });
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
