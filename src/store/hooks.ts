import { useStore, RootState } from './store';
import { authService } from '../services/authService';
import { localExpenseService } from '../services/localExpenseService';
import { expenseSyncService } from '../services/expenseSyncService';
import { expenseService } from '../services/expenseService';
import { groupService } from '../services/groupService';
import { SignInPayload, SignUpPayload } from './auth.types';
import { LocalExpense } from './expense.types';
import { getLocalDateString, formatExpenseDateForServer } from '../utils/date';

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
  const { expenses, isLoading, isSyncing, error, lastSyncedAt, newlyAddedId } = state.expenses;
  const isAuthenticated = state.auth.isAuthenticated;

  const todayStr = getLocalDateString();

  const personalExpenses = expenses.filter((e) => e.type !== 'GROUP');
  const groupExpenses = expenses.filter((e) => e.type === 'GROUP');

  const todayExpenses = personalExpenses.filter((e) => {
    const expenseDate = e.date ? e.date.split('T')[0] : '';
    return expenseDate === todayStr;
  });

  const pendingExpenses = expenses.filter(
    (e) => e.syncStatus === 'pending' || e.syncStatus === 'failed'
  );

  const totalExpenseAmount = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
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
    participants?: Array<{ userId: string; shareAmount?: number }>;
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
      participants: input.participants,
      createdAt: now,
      updatedAt: now,
    };

    if (isAuthenticated) {
      try {
        let result: any;
        if (newExpense.type === 'GROUP' && newExpense.groupId) {
          result = await groupService.addGroupExpense({
            groupId: newExpense.groupId,
            amount: newExpense.amount,
            category: newExpense.category,
            subcategory: newExpense.subcategory || undefined,
            title: newExpense.title || undefined,
            note: newExpense.note || undefined,
            expenseDate: formatExpenseDateForServer(newExpense.date),
            splitType: 'EQUAL',
            participants:
              input.participants && input.participants.length > 0
                ? input.participants
                : undefined,
          });
        } else {
          result = await expenseService.createPersonalExpense(newExpense);
        }
        const serverId = result?.id || result?.expense?.id || `srv_${Date.now()}`;
        const syncedExpense: LocalExpense = {
          ...newExpense,
          serverId,
          syncStatus: 'synced',
          participants: result?.participants || newExpense.participants,
        };
        await localExpenseService.saveExpenseLocally(syncedExpense);
        dispatch({ type: 'expenses/addLocalExpense', payload: syncedExpense });
        return syncedExpense;
      } catch {}
    }

    await localExpenseService.saveExpenseLocally(newExpense);
    dispatch({ type: 'expenses/addLocalExpense', payload: newExpense });

    return newExpense;
  };

  const refreshExpenses = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await expenseService.getPersonalExpenses({ limit: 100 });
      const serverExpenses =
        res?.expenses ||
        res?.data?.expenses ||
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      if (Array.isArray(serverExpenses)) {
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
            localId: `srv_${se.id}`,
            serverId: se.id,
            amount: Number(se.amount),
            category: se.category,
            subcategory: se.subcategory || null,
            title: se.title || null,
            date: formattedDate,
            note: se.note || null,
            syncStatus: 'synced' as const,
            type: 'PERSONAL',
            groupId: se.groupId || null,
            createdAt: se.createdAt,
            updatedAt: se.updatedAt || se.createdAt,
          };
        });
        const currentLocal = await localExpenseService.getLocalExpenses();
        const pendingItems = currentLocal.filter(
          (e) => e.syncStatus === 'pending' || e.syncStatus === 'failed'
        );
        const reconciled = [...pendingItems, ...serverMapped];
        await localExpenseService.setLocalExpenses(reconciled);
        dispatch({ type: 'expenses/setExpenses', payload: reconciled });
      }
    } catch {}
  };

  const deleteExpense = async (localId: string) => {
    await localExpenseService.deleteLocalExpense(localId);
    dispatch({ type: 'expenses/removeExpense', payload: localId });
  };

  const syncExpenses = async () => {
    return await expenseSyncService.syncPendingExpenses(dispatch);
  };

  const clearNewlyAddedId = () => {
    dispatch({ type: 'expenses/setNewlyAddedId', payload: null });
  };

  const clearAllExpenses = async () => {
    await localExpenseService.setLocalExpenses([]);
    dispatch({ type: 'expenses/setExpenses', payload: [] });
  };

  return {
    expenses,
    personalExpenses,
    groupExpenses,
    todayExpenses,
    pendingExpenses,
    totalExpenseAmount,
    todayExpenseAmount,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    newlyAddedId,
    clearNewlyAddedId,
    addExpense,
    deleteExpense,
    syncExpenses,
    refreshExpenses,
    clearAllExpenses,
  };
};
