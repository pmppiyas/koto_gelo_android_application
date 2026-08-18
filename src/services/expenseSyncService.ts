import { localExpenseService } from './localExpenseService';
import { expenseService } from './expenseService';
import { LocalExpense } from '../features/expenses/expense.types';

let isSyncing = false;

export const expenseSyncService = {
  getIsSyncing(): boolean {
    return isSyncing;
  },

  async syncPendingExpenses(dispatch?: (action: any) => void): Promise<{
    syncedCount: number;
    failedCount: number;
    syncedIds: string[];
  }> {
    if (isSyncing) {
      return { syncedCount: 0, failedCount: 0, syncedIds: [] };
    }

    isSyncing = true;
    if (dispatch) {
      dispatch({ type: 'expenses/setSyncing', payload: true });
    }

    let syncedCount = 0;
    let failedCount = 0;
    const syncedIds: string[] = [];

    try {
      const pending = await localExpenseService.getPendingExpenses();

      for (const expense of pending) {
        try {
          const result = await expenseService.createPersonalExpense(expense);
          const serverId = result?.id || result?.expense?.id || `srv_${Date.now()}`;

          await localExpenseService.markExpenseAsSynced(expense.localId, serverId);

          if (dispatch) {
            dispatch({
              type: 'expenses/markExpenseSynced',
              payload: { localId: expense.localId, serverId },
            });
          }

          syncedCount++;
          syncedIds.push(expense.localId);
        } catch (err) {
          failedCount++;
          await localExpenseService.updateLocalExpense(expense.localId, {
            syncStatus: 'failed',
          });

          if (dispatch) {
            dispatch({
              type: 'expenses/updateExpense',
              payload: {
                localId: expense.localId,
                updates: { syncStatus: 'failed' },
              },
            });
          }
        }
      }

      if (dispatch) {
        dispatch({
          type: 'expenses/setLastSyncedAt',
          payload: new Date().toISOString(),
        });
      }
    } catch (globalErr: any) {
      if (dispatch) {
        dispatch({
          type: 'expenses/setError',
          payload: globalErr?.message || 'Sync failed',
        });
      }
    } finally {
      isSyncing = false;
      if (dispatch) {
        dispatch({ type: 'expenses/setSyncing', payload: false });
      }
    }

    return { syncedCount, failedCount, syncedIds };
  },

  async syncSingleExpense(
    expense: LocalExpense,
    dispatch?: (action: any) => void
  ): Promise<boolean> {
    try {
      const result = await expenseService.createPersonalExpense(expense);
      const serverId = result?.id || result?.expense?.id || `srv_${Date.now()}`;

      await localExpenseService.markExpenseAsSynced(expense.localId, serverId);

      if (dispatch) {
        dispatch({
          type: 'expenses/markExpenseSynced',
          payload: { localId: expense.localId, serverId },
        });
      }

      return true;
    } catch (err) {
      await localExpenseService.updateLocalExpense(expense.localId, {
        syncStatus: 'pending',
      });
      return false;
    }
  },
};
