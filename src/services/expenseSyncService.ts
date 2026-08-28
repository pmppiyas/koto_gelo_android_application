import { database } from './database/database';
import { localExpenseService } from './localExpenseService';
import { localGroupService } from './localGroupService';
import { expenseService } from './expenseService';
import { groupService } from './groupService';
import { syncProcessor } from './sync/syncProcessor';
import { LocalExpense } from '../features/expenses/expense.types';
import { formatExpenseDateForServer } from '../utils/date';

export interface SyncProgressState {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  detail: string;
  percentage: number;
}

export type ProgressCallback = (progress: SyncProgressState) => void;

let isSyncing = false;
const inFlightSyncIds = new Set<string>();

async function syncExpenseToServer(expense: LocalExpense): Promise<any> {
  if (expense.type === 'GROUP' && expense.groupId) {
    return await groupService.addGroupExpense({
      groupId: expense.groupId,
      amount: expense.amount,
      category: expense.category,
      subcategory: expense.subcategory || undefined,
      title: expense.title || undefined,
      note: expense.note || undefined,
      expenseDate: formatExpenseDateForServer(expense.date),
      splitType: 'EQUAL',
      participants: (expense as any).participants,
    });
  }
  return await expenseService.createPersonalExpense(expense);
}

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
      // 1. Process background sync queue items
      await syncProcessor.processAll();

      // 2. Process pending personal & group expenses
      const pending = await localExpenseService.getPendingExpenses();
      // Filter out items already in flight
      const availablePending = pending.filter(e => !inFlightSyncIds.has(e.localId));

      for (const expense of availablePending) {
        inFlightSyncIds.add(expense.localId);
        try {
          const result = await syncExpenseToServer(expense);
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
        } catch {
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
        } finally {
          inFlightSyncIds.delete(expense.localId);
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
    if (inFlightSyncIds.has(expense.localId)) {
      return true; // Already syncing
    }
    inFlightSyncIds.add(expense.localId);
    try {
      const result = await syncExpenseToServer(expense);
      const serverId = result?.id || result?.expense?.id || `srv_${Date.now()}`;

      await localExpenseService.markExpenseAsSynced(expense.localId, serverId);

      if (dispatch) {
        dispatch({
          type: 'expenses/markExpenseSynced',
          payload: { localId: expense.localId, serverId },
        });
      }

      return true;
    } catch {
      await localExpenseService.updateLocalExpense(expense.localId, {
        syncStatus: 'pending',
      });
      return false;
    } finally {
      inFlightSyncIds.delete(expense.localId);
    }
  },

  /**
   * 5-STAGE AUTHENTICATION SYNCHRONIZATION ENGINE:
   * Called during Login / Registration to isolate data per user,
   * pull complete cloud records, and hydrate local SQLite storage.
   */
  async syncOnAuth(
    onProgress?: ProgressCallback,
    dispatch?: (action: any) => void
  ): Promise<void> {
    isSyncing = true;
    try {
      // ----------------------------------------------------
      // STEP 1: Clear stale session & prepare clean SQLite tables (20%)
      // ----------------------------------------------------
      onProgress?.({
        currentStep: 1,
        totalSteps: 5,
        stepName: 'Local Database Prepared',
        detail: 'Initializing local storage & clearing previous session...',
        percentage: 20,
      });

      await Promise.all([
        database.clearAllData(),
        localGroupService.clearAll().catch(() => {}),
      ]);
      if (dispatch) {
        dispatch({ type: 'expenses/setExpenses', payload: [] });
      }
      await new Promise(r => setTimeout(r, 60));

      // ----------------------------------------------------
      // STEP 2: Fetch Personal Expenses from Backend (45%)
      // ----------------------------------------------------
      onProgress?.({
        currentStep: 2,
        totalSteps: 5,
        stepName: 'Personal Expenses Synced',
        detail: 'Downloading personal transactions from server...',
        percentage: 45,
      });

      let localPersonalExpenses: LocalExpense[] = [];
      try {
        const pRes = await expenseService.getPersonalExpenses({ limit: 500 });
        const serverExpenses =
          Array.isArray(pRes)
            ? pRes
            : Array.isArray(pRes?.data)
            ? pRes.data
            : Array.isArray(pRes?.expenses)
            ? pRes.expenses
            : Array.isArray(pRes?.data?.expenses)
            ? pRes.data.expenses
            : Array.isArray(pRes?.history)
            ? pRes.history
            : [];

        if (serverExpenses.length > 0) {
          const todayStr = getLocalDateString();
          localPersonalExpenses = serverExpenses.map((e: any) => {
            let formattedDate = todayStr;
            const rawDate = e.expenseDate || e.date || e.createdAt;
            if (rawDate) {
              try {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                  formattedDate = getLocalDateString(parsed);
                } else {
                  formattedDate = String(rawDate).slice(0, 10);
                }
              } catch {
                formattedDate = String(rawDate).slice(0, 10);
              }
            }

            return {
              localId: `srv_${e.id || e._id || Date.now()}`,
              serverId: e.id || e._id || null,
              amount: Number(e.amount) || 0,
              category: e.category || 'Other',
              subcategory: e.subcategory || null,
              title: e.title || null,
              note: e.note || null,
              date: formattedDate,
              syncStatus: 'synced' as const,
              type: 'PERSONAL' as const,
              createdAt: e.createdAt || new Date().toISOString(),
              updatedAt: e.updatedAt || new Date().toISOString(),
            };
          });
          await localExpenseService.setLocalExpenses(localPersonalExpenses);
        }
      } catch (eErr) {
        console.warn('Personal expense sync warning:', eErr);
      }
      await new Promise(r => setTimeout(r, 60));

      // ----------------------------------------------------
      // STEP 3: Fetch Groups & Members (70%)
      // ----------------------------------------------------
      onProgress?.({
        currentStep: 3,
        totalSteps: 5,
        stepName: 'Groups & Members Synced',
        detail: 'Downloading group memberships & profile details...',
        percentage: 70,
      });

      let groupsList: any[] = [];
      try {
        const groupsRes = await groupService.getGroups({ limit: 100 });
        groupsList =
          groupsRes?.groups ||
          groupsRes?.data?.groups ||
          (Array.isArray(groupsRes) ? groupsRes : []);

        if (Array.isArray(groupsList) && groupsList.length > 0) {
          await localGroupService.setStoredGroups(groupsList);
        }
      } catch (gErr) {
        console.warn('Group sync warning:', gErr);
      }
      await new Promise(r => setTimeout(r, 60));

      // ----------------------------------------------------
      // STEP 4: Parallel Fetch Group Expenses, Deposits & Balances (90%)
      // ----------------------------------------------------
      onProgress?.({
        currentStep: 4,
        totalSteps: 5,
        stepName: 'Group Records Synced',
        detail: 'Downloading split expenses, deposits & balances in parallel...',
        percentage: 88,
      });

      if (groupsList.length > 0) {
        // Run all group detail, expense & deposit network requests concurrently in parallel!
        await Promise.allSettled(
          groupsList.map(async (grp) => {
            try {
              const [expRes, depRes, detailRes] = await Promise.allSettled([
                groupService.getGroupExpenses(grp.id, { limit: 100 }),
                groupService.getGroupDeposits(grp.id, { limit: 100 }),
                groupService.getGroupById(grp.id),
              ]);

              if (detailRes.status === 'fulfilled') {
                const grpData = (detailRes.value as any)?.data || detailRes.value;
                if (grpData && grpData.id) {
                  await localGroupService.saveGroupLocally(grpData, 'synced');
                }
              }

              if (expRes.status === 'fulfilled') {
                const val = expRes.value as any;
                const exps =
                  val?.history ||
                  val?.data?.history ||
                  val?.expenses ||
                  val?.data?.expenses ||
                  (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
                if (Array.isArray(exps) && exps.length > 0) {
                  await localGroupService.setStoredGroupExpenses(exps);
                }
              }

              if (depRes.status === 'fulfilled') {
                const val = depRes.value as any;
                const deps =
                  val?.deposits ||
                  val?.data?.deposits ||
                  (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
                if (Array.isArray(deps) && deps.length > 0) {
                  await localGroupService.setStoredGroupDeposits(deps);
                }
              }
            } catch {}
          })
        );
      }
      await new Promise(r => setTimeout(r, 60));

      // ----------------------------------------------------
      // STEP 5: Hydrate Redux & Finalize Setup (100%)
      // ----------------------------------------------------
      onProgress?.({
        currentStep: 5,
        totalSteps: 5,
        stepName: 'Workspace Ready',
        detail: 'Pre-populating dashboard & launching workspace...',
        percentage: 100,
      });

      // Load all stored personal expenses from SQLite into Redux immediately
      const allStoredExpenses = await localExpenseService.getLocalExpenses();
      if (dispatch) {
        dispatch({ type: 'expenses/setExpenses', payload: allStoredExpenses });
        dispatch({
          type: 'expenses/setLastSyncedAt',
          payload: new Date().toISOString(),
        });
      }
      await new Promise(r => setTimeout(r, 120));
    } finally {
      isSyncing = false;
    }
  },

  async pullLatestRemoteData(): Promise<void> {
    try {
      // Pull Groups
      const groupsRes = await groupService.getGroups({ limit: 100 });
      const groupsList =
        groupsRes?.groups ||
        groupsRes?.data?.groups ||
        (Array.isArray(groupsRes) ? groupsRes : []);
      if (Array.isArray(groupsList) && groupsList.length > 0) {
        await localGroupService.setStoredGroups(groupsList);

        for (const grp of groupsList) {
          try {
            const expRes = await groupService.getGroupExpenses(grp.id, { limit: 100 });
            const exps =
              expRes?.history || expRes?.expenses || (Array.isArray(expRes) ? expRes : []);
            if (Array.isArray(exps)) {
              await localGroupService.setStoredGroupExpenses(exps);
            }

            const depRes = await groupService.getGroupDeposits(grp.id, { limit: 100 });
            const deps =
              depRes?.deposits || (Array.isArray(depRes) ? depRes : []);
            if (Array.isArray(deps)) {
              await localGroupService.setStoredGroupDeposits(deps);
            }
          } catch {}
        }
      }
    } catch {}
  },
};
