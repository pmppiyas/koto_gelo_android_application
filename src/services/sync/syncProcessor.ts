import { syncQueue } from './syncQueue';
import { SyncQueueItem, syncRepository } from '../database/repositories/sync.repository';
import { expenseService } from '../expenseService';
import { groupService } from '../groupService';
import { expenseRepository } from '../database/repositories/expense.repository';
import { groupRepository } from '../database/repositories/group.repository';
import { groupExpenseRepository } from '../database/repositories/groupExpense.repository';
import { groupDepositRepository } from '../database/repositories/groupDeposit.repository';

export class SyncProcessor {
  async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      await syncRepository.updateStatus(item.id, 'in_progress');

      switch (item.action) {
        case 'CREATE_PERSONAL_EXPENSE': {
          const res = await expenseService.createPersonalExpense(item.payload);
          const serverId = res?.id || res?.expense?.id;
          if (serverId && item.payload.localId) {
            await expenseRepository.markAsSynced(item.payload.localId, serverId);
          }
          break;
        }

        case 'UPDATE_PERSONAL_EXPENSE': {
          const id = item.payload.serverId || item.payload.id;
          if (id) {
            await expenseService.updatePersonalExpense(id, item.payload.data);
          }
          break;
        }

        case 'DELETE_PERSONAL_EXPENSE': {
          const id = item.payload.serverId || item.payload.id;
          if (id && !id.startsWith('loc_')) {
            await expenseService.deletePersonalExpense(id);
          }
          break;
        }

        case 'CREATE_GROUP': {
          const res = await groupService.createGroup(item.payload);
          if (res?.id) {
            await groupRepository.save(res, 'synced');
          }
          break;
        }

        case 'UPDATE_GROUP': {
          if (item.payload.id) {
            await groupService.updateGroup(item.payload.id, item.payload.data);
          }
          break;
        }

        case 'DELETE_GROUP': {
          if (item.payload.id) {
            await groupService.deleteGroup(item.payload.id);
          }
          break;
        }

        case 'CREATE_GROUP_EXPENSE': {
          const res = await groupService.addGroupExpense(item.payload);
          const serverId = res?.id || res?.expense?.id;
          if (serverId && item.payload.localId) {
            await groupExpenseRepository.markAsSynced(item.payload.localId, serverId);
          }
          break;
        }

        case 'DELETE_GROUP_EXPENSE': {
          const id = item.payload.serverId || item.payload.id;
          if (id && !id.startsWith('lge_')) {
            await groupService.deleteGroupExpense(id);
          }
          break;
        }

        case 'CREATE_GROUP_DEPOSIT': {
          const res = await groupService.addGroupDeposit(item.payload);
          const serverId = res?.id || res?.deposit?.id;
          if (serverId && item.payload.localId) {
            await groupDepositRepository.markAsSynced(item.payload.localId, serverId);
          }
          break;
        }

        case 'UPDATE_GROUP_DEPOSIT': {
          const id = item.payload.serverId || item.payload.id;
          if (id) {
            await groupService.updateGroupDeposit(id, item.payload.data);
          }
          break;
        }

        case 'DELETE_GROUP_DEPOSIT': {
          const id = item.payload.serverId || item.payload.id;
          if (id && !id.startsWith('lgd_')) {
            await groupService.deleteGroupDeposit(id);
          }
          break;
        }

        case 'SETTLE_PAYMENT': {
          await groupService.settlePayment(item.payload);
          break;
        }

        default:
          break;
      }

      await syncQueue.removeItem(item.id);
      return true;
    } catch (error: any) {
      await syncRepository.updateStatus(item.id, 'failed', error?.message || 'Sync error');
      return false;
    }
  }

  async processAll(): Promise<{ successCount: number; failureCount: number }> {
    const items = await syncQueue.getPendingItems();
    let successCount = 0;
    let failureCount = 0;

    for (const item of items) {
      const ok = await this.processItem(item);
      if (ok) successCount++;
      else failureCount++;
    }

    return { successCount, failureCount };
  }
}

export const syncProcessor = new SyncProcessor();
