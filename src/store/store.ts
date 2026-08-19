import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authReducer, initialAuthState, AuthAction } from '../features/auth/authSlice';
import { expenseReducer, initialExpenseState } from '../features/expenses/expenseSlice';
import { AuthState } from '../features/auth/auth.types';
import { ExpenseState, ExpenseAction } from '../features/expenses/expense.types';
import { authService } from '../services/authService';
import { localExpenseService } from '../services/localExpenseService';
import { expenseSyncService } from '../services/expenseSyncService';
import { storage, STORAGE_KEYS } from '../config/storage';
import { API_ENDPOINTS } from '../config/api';

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

async function verifyToken(token: string): Promise<boolean> {
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
    return res.ok;
  } catch {
    return false;
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
    const initializeApp = async () => {
      try {
        const localExpenses = await localExpenseService.getLocalExpenses();
        expenseDispatch({ type: 'expenses/setExpenses', payload: localExpenses });

        const token = await authService.getStoredToken();

        if (!token) {
          authDispatch({ type: 'auth/setLoading', payload: false });
          return;
        }

        const isValid = await verifyToken(token);

        if (!isValid) {
          await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await storage.removeItem(STORAGE_KEYS.USER);
          authDispatch({ type: 'auth/logout' });
          return;
        }

        const user = await authService.getStoredUser();
        authDispatch({
          type: 'auth/setTokenOnly',
          payload: { token, user },
        });

        expenseSyncService.syncPendingExpenses(combinedDispatch);
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
