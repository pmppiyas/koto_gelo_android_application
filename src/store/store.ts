import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authReducer, initialAuthState, AuthAction } from '../features/auth/authSlice';
import { expenseReducer, initialExpenseState } from '../features/expenses/expenseSlice';
import { AuthState } from '../features/auth/auth.types';
import { ExpenseState, ExpenseAction } from '../features/expenses/expense.types';
import { authService } from '../services/authService';
import { localExpenseService } from '../services/localExpenseService';
import { expenseSyncService } from '../services/expenseSyncService';

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
        if (token) {
          const user = await authService.getStoredUser();
          authDispatch({
            type: 'auth/setTokenOnly',
            payload: { token, user },
          });

          expenseSyncService.syncPendingExpenses(combinedDispatch);
        } else {
          authDispatch({ type: 'auth/setLoading', payload: false });
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
