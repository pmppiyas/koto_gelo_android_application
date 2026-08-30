import { ExpenseState, ExpenseAction } from './expense.types';

export const initialExpenseState: ExpenseState = {
  expenses: [],
  isLoading: false,
  error: null,
  newlyAddedId: null,
};

export const expenseReducer = (
  state: ExpenseState,
  action: ExpenseAction
): ExpenseState => {
  switch (action.type) {
    case 'expenses/setExpenses': {
      const seen = new Set<string>();
      const deduped = (action.payload || []).filter((e) => {
        const key = e.id || e.localId;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...state, expenses: deduped, isLoading: false, error: null };
    }
    case 'expenses/addExpense':
      return {
        ...state,
        expenses: [
          action.payload,
          ...state.expenses.filter(
            (e) => (e.id || e.localId) !== (action.payload.id || action.payload.localId)
          ),
        ],
        newlyAddedId: action.payload.id || action.payload.localId || null,
      };
    case 'expenses/updateExpense': {
      const payload = action.payload;
      if ('updates' in payload) {
        return {
          ...state,
          expenses: state.expenses.map((e) =>
            (e.id || e.localId) === payload.id ? { ...e, ...payload.updates } : e
          ),
        };
      }
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          (e.id || e.localId) === (payload.id || payload.localId) ? payload : e
        ),
      };
    }
    case 'expenses/removeExpense':
      return {
        ...state,
        expenses: state.expenses.filter((e) => (e.id || e.localId) !== action.payload),
        newlyAddedId:
          state.newlyAddedId === action.payload ? null : state.newlyAddedId,
      };
    case 'expenses/setLoading':
      return { ...state, isLoading: action.payload };
    case 'expenses/setError':
      return { ...state, error: action.payload, isLoading: false };
    case 'expenses/setNewlyAddedId':
      return { ...state, newlyAddedId: action.payload };
    default:
      return state;
  }
};
