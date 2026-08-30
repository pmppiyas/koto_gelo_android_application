import { useCallback } from 'react';
import { useStore, RootState } from './store';
import { authService } from '../services/authService';
import { expenseService } from '../services/expenseService';
import { groupService } from '../services/groupService';
import { SignInPayload, SignUpPayload } from './auth.types';
import { LocalExpense } from './expense.types';
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

  const signin = useCallback(async (payload: SignInPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signin(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'auth/setLoading', payload: false });
    }
  }, [dispatch]);

  const signup = useCallback(async (payload: SignUpPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signup(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'auth/setLoading', payload: false });
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    dispatch({ type: 'auth/logout' });
    dispatch({ type: 'expenses/setExpenses', payload: [] });
    await authService.logout().catch(() => {});
  }, [dispatch]);

  return {
    ...auth,
    signin,
    signup,
    logout,
    clearError: useCallback(() => dispatch({ type: 'auth/setError', payload: null }), [dispatch]),
  };
};

export const useExpenses = () => {
  const { state, dispatch } = useStore();
  const { expenses, isLoading, error, newlyAddedId } = state.expenses;
  const isAuthenticated = state.auth.isAuthenticated;

  const todayStr = getLocalDateString();

  const personalExpenses = expenses.filter((e) => e.type !== 'GROUP');
  const groupExpenses = expenses.filter((e) => e.type === 'GROUP');

  const todayExpenses = personalExpenses.filter((e) => {
    const expenseDate = e.date ? e.date.split('T')[0] : '';
    return expenseDate === todayStr;
  });

  const totalExpenseAmount = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const todayExpenseAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const addExpense = useCallback(async (input: {
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
    const today = getLocalDateString();
    dispatch({ type: 'expenses/setLoading', payload: true });
    try {
      if (input.type === 'GROUP' && input.groupId) {
        const res = await groupService.addGroupExpense({
          groupId: input.groupId,
          amount: input.amount,
          category: input.category,
          subcategory: input.subcategory || undefined,
          title: input.title || undefined,
          note: input.note || undefined,
          expenseDate: input.date || today,
          splitType: 'EQUAL',
          paymentSource: (input as any).paymentSource,
          paidFrom: (input as any).paidFrom,
          payers: (input as any).payers,
          participants: input.participants,
        });

        const createdItem = res?.data || res?.expense || res;
        const newExpense: LocalExpense = {
          id: createdItem?.id || `grp_${Date.now()}`,
          localId: createdItem?.id || `grp_${Date.now()}`,
          amount: Number(input.amount),
          category: input.category,
          subcategory: input.subcategory || null,
          title: input.title?.trim() || null,
          date: input.date || today,
          note: input.note?.trim() || null,
          type: 'GROUP',
          groupId: input.groupId,
          participants: input.participants,
          createdAt: createdItem?.createdAt || new Date().toISOString(),
          updatedAt: createdItem?.updatedAt || new Date().toISOString(),
        };

        dispatch({ type: 'expenses/addExpense', payload: newExpense });
        return newExpense;
      }

      // Default: PERSONAL Expense via direct REST API
      const res = await expenseService.createPersonalExpense({
        amount: input.amount,
        category: input.category,
        subcategory: input.subcategory || null,
        title: input.title || null,
        date: input.date || today,
        note: input.note || null,
      });

      const created = res?.data || res?.expense || res;
      let formattedDate = input.date || today;
      const rawDate = created?.expenseDate || created?.date || created?.createdAt;
      if (rawDate) {
        try {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            formattedDate = getLocalDateString(parsed);
          }
        } catch {}
      }

      const newExpense: LocalExpense = {
        id: created?.id || `exp_${Date.now()}`,
        localId: created?.id || `exp_${Date.now()}`,
        amount: Number(created?.amount || input.amount),
        category: created?.category || input.category,
        subcategory: created?.subcategory || input.subcategory || null,
        title: created?.title || input.title?.trim() || null,
        date: formattedDate,
        note: created?.note || input.note?.trim() || null,
        type: 'PERSONAL',
        createdAt: created?.createdAt || new Date().toISOString(),
        updatedAt: created?.updatedAt || new Date().toISOString(),
      };

      dispatch({ type: 'expenses/addExpense', payload: newExpense });
      return newExpense;
    } catch (err: any) {
      dispatch({ type: 'expenses/setError', payload: err?.message || 'Failed to save expense' });
      throw err;
    } finally {
      dispatch({ type: 'expenses/setLoading', payload: false });
    }
  }, [dispatch]);

  const refreshExpenses = useCallback(async () => {
    if (!isAuthenticated) return;
    const today = getLocalDateString();
    dispatch({ type: 'expenses/setLoading', payload: true });
    try {
      const res = await expenseService.getPersonalExpenses({ limit: 100 });
      const serverExpenses =
        res?.expenses ||
        res?.data?.expenses ||
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);

      if (Array.isArray(serverExpenses)) {
        const serverMapped: LocalExpense[] = serverExpenses.map((se: any) => {
          let formattedDate = today;
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

        dispatch({ type: 'expenses/setExpenses', payload: serverMapped });
      }
    } catch (err: any) {
      dispatch({ type: 'expenses/setError', payload: err?.message || 'Failed to fetch expenses' });
    } finally {
      dispatch({ type: 'expenses/setLoading', payload: false });
    }
  }, [isAuthenticated, dispatch]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await expenseService.deletePersonalExpense(id);
      dispatch({ type: 'expenses/removeExpense', payload: id });
    } catch (err: any) {
      dispatch({ type: 'expenses/setError', payload: err?.message || 'Failed to delete expense' });
      throw err;
    }
  }, [dispatch]);

  const clearNewlyAddedId = useCallback(() => {
    dispatch({ type: 'expenses/setNewlyAddedId', payload: null });
  }, [dispatch]);

  return {
    expenses,
    personalExpenses,
    groupExpenses,
    todayExpenses,
    pendingExpenses: [],
    totalExpenseAmount,
    todayExpenseAmount,
    isLoading,
    isSyncing: false,
    error,
    newlyAddedId,
    clearNewlyAddedId,
    addExpense,
    deleteExpense,
    refreshExpenses,
  };
};

