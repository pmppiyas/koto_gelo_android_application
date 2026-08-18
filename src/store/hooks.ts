import { useStore, RootState } from './store';
import { authService } from '../services/authService';
import { localExpenseService } from '../services/localExpenseService';
import { expenseSyncService } from '../services/expenseSyncService';
import { storage, STORAGE_KEYS } from '../config/storage';
import { SignInPayload, SignUpPayload } from '../features/auth/auth.types';
import { LocalExpense } from '../features/expenses/expense.types';
import { getLocalDateString } from '../utils/date';

export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  const { state } = useStore();
  return selector(state);
};

export const useAppDispatch = () => {
  const { dispatch } = useStore();
  return dispatch;
};

export const useAuth = () => {
  const { state, dispatch } = useStore();
  const auth = state.auth;

  const signin = async (payload: SignInPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signin(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      expenseSyncService.syncPendingExpenses(dispatch);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    }
  };

  const signup = async (payload: SignUpPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signup(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      expenseSyncService.syncPendingExpenses(dispatch);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    }
  };

  const logout = async () => {
    dispatch({ type: 'auth/setLoading', payload: true });
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'auth/logout' });
    }
  };

  return {
    ...auth,
    signin,
    signup,
    logout,
    clearError: () => dispatch({ type: 'auth/setError', payload: null }),
  };
};

export const useExpenses = () => {
  const { state, dispatch } = useStore();
  const { expenses, isLoading, isSyncing, error, lastSyncedAt } = state.expenses;
  const isAuthenticated = state.auth.isAuthenticated;

  const todayStr = getLocalDateString();

  const todayExpenses = expenses.filter((e) => {
    const expenseDate = e.date ? e.date.split('T')[0] : '';
    return expenseDate === todayStr;
  });

  const pendingExpenses = expenses.filter(
    (e) => e.syncStatus === 'pending' || e.syncStatus === 'failed'
  );

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const todayExpenseAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const addExpense = async (input: {
    amount: number;
    category: string;
    subcategory?: string | null;
    title?: string | null;
    date?: string;
    note?: string | null;
    type?: 'PERSONAL' | 'GROUP';
    groupId?: string | null;
  }): Promise<LocalExpense> => {
    const localId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newExpense: LocalExpense = {
      localId,
      serverId: null,
      amount: Number(input.amount),
      category: input.category,
      subcategory: input.subcategory || null,
      title: input.title?.trim() || null,
      date: input.date || todayStr,
      note: input.note?.trim() || null,
      syncStatus: 'pending',
      type: input.type || 'PERSONAL',
      groupId: input.groupId || null,
      createdAt: now,
      updatedAt: now,
    };

    await localExpenseService.saveExpenseLocally(newExpense);
    dispatch({ type: 'expenses/addLocalExpense', payload: newExpense });

    const storedToken = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (isAuthenticated || storedToken) {
      try {
        await expenseSyncService.syncSingleExpense(newExpense, dispatch);
      } catch {}
    }

    return newExpense;
  };

  const deleteExpense = async (localId: string) => {
    await localExpenseService.deleteLocalExpense(localId);
    dispatch({ type: 'expenses/removeExpense', payload: localId });
  };

  const syncExpenses = async () => {
    return await expenseSyncService.syncPendingExpenses(dispatch);
  };

  return {
    expenses,
    todayExpenses,
    pendingExpenses,
    totalExpenseAmount,
    todayExpenseAmount,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    addExpense,
    deleteExpense,
    syncExpenses,
  };
};
