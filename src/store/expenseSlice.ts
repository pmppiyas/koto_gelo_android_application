import { ExpenseState, ExpenseAction } from './expense.types';

export const initialExpenseState: ExpenseState = {
  expenses: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  lastSyncedAt: null,
  newlyAddedId: null,
};

export const expenseReducer = (
  state: ExpenseState,
  action: ExpenseAction
): ExpenseState => {
  switch (action.type) {
    case 'expenses/setExpenses':
      return { ...state, expenses: action.payload };
    case 'expenses/addLocalExpense':
      return {
        ...state,
        expenses: [
          action.payload,
          ...state.expenses.filter(
            (e) =>
              e.localId !== action.payload.localId &&
              (!action.payload.serverId || e.serverId !== action.payload.serverId)
          ),
        ],
        newlyAddedId: action.payload.localId,
      };
    case 'expenses/updateExpense':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.localId === action.payload.localId ? action.payload : e
        ),
      };
    case 'expenses/removeExpense':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.localId !== action.payload),
        newlyAddedId:
          state.newlyAddedId === action.payload ? null : state.newlyAddedId,
      };
    case 'expenses/setLoading':
      return { ...state, isLoading: action.payload };
    case 'expenses/setSyncing':
      return { ...state, isSyncing: action.payload };
    case 'expenses/setError':
      return { ...state, error: action.payload, isLoading: false };
    case 'expenses/setLastSyncedAt':
      return { ...state, lastSyncedAt: action.payload };
    case 'expenses/setNewlyAddedId':
      return { ...state, newlyAddedId: action.payload };
    default:
      return state;
  }
};
