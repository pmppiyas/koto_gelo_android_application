import { ExpenseState, ExpenseAction } from './expense.types';

export const initialExpenseState: ExpenseState = {
  expenses: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  lastSyncedAt: null,
};

export const expenseReducer = (
  state = initialExpenseState,
  action: ExpenseAction
): ExpenseState => {
  switch (action.type) {
    case 'expenses/setExpenses':
      return {
        ...state,
        expenses: action.payload,
        isLoading: false,
      };

    case 'expenses/addLocalExpense':
      return {
        ...state,
        expenses: [
          action.payload,
          ...state.expenses.filter((e) => e.localId !== action.payload.localId),
        ],
      };

    case 'expenses/updateExpense':
      return {
        ...state,
        expenses: state.expenses.map((item) =>
          item.localId === action.payload.localId
            ? { ...item, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : item
        ),
      };

    case 'expenses/removeExpense':
      return {
        ...state,
        expenses: state.expenses.filter((item) => item.localId !== action.payload),
      };

    case 'expenses/markExpenseSynced':
      return {
        ...state,
        expenses: state.expenses.map((item) =>
          item.localId === action.payload.localId
            ? {
                ...item,
                serverId: action.payload.serverId,
                syncStatus: 'synced',
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      };

    case 'expenses/setLoading':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'expenses/setSyncing':
      return {
        ...state,
        isSyncing: action.payload,
      };

    case 'expenses/setError':
      return {
        ...state,
        error: action.payload,
        isSyncing: false,
      };

    case 'expenses/setLastSyncedAt':
      return {
        ...state,
        lastSyncedAt: action.payload,
        isSyncing: false,
      };

    default:
      return state;
  }
};
