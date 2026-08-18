import { apiClient } from '../../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../../constants/api';
import {
  GroupExpense,
  CreateGroupExpenseDto,
  UpdateGroupExpenseDto,
} from '../types/groupExpense.types';
import { GroupBalanceSummary } from '../types/balance.types';
import { SettlementSuggestion } from '../types/settlement.types';

export const groupExpenseApi = {
  getAll: async (groupId: string): Promise<GroupExpense[]> => {
    const res = await apiClient.get<GroupExpense[]>(API_ENDPOINTS.GROUP_EXPENSES.BASE(groupId));
    return res.data;
  },

  getById: async (groupId: string, expenseId: string): Promise<GroupExpense> => {
    const res = await apiClient.get<GroupExpense>(
      API_ENDPOINTS.GROUP_EXPENSES.BY_ID(groupId, expenseId)
    );
    return res.data;
  },

  create: async (dto: CreateGroupExpenseDto): Promise<GroupExpense> => {
    const res = await apiClient.post<GroupExpense>(
      API_ENDPOINTS.GROUP_EXPENSES.BASE(dto.groupId),
      dto
    );
    return res.data;
  },

  update: async (groupId: string, expenseId: string, dto: UpdateGroupExpenseDto): Promise<GroupExpense> => {
    const res = await apiClient.patch<GroupExpense>(
      API_ENDPOINTS.GROUP_EXPENSES.BY_ID(expenseId, groupId),
      dto
    );
    return res.data;
  },

  delete: async (groupId: string, expenseId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.GROUP_EXPENSES.BY_ID(groupId, expenseId));
  },

  getBalances: async (groupId: string): Promise<GroupBalanceSummary> => {
    const res = await apiClient.get<GroupBalanceSummary>(
      API_ENDPOINTS.GROUP_EXPENSES.BALANCES(groupId)
    );
    return res.data;
  },

  getSettlements: async (groupId: string): Promise<SettlementSuggestion[]> => {
    const res = await apiClient.get<SettlementSuggestion[]>(
      API_ENDPOINTS.GROUP_EXPENSES.SETTLEMENTS(groupId)
    );
    return res.data;
  },
};
