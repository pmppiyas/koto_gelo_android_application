import { apiClient } from '../../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../../constants/api';
import {
  PersonalExpense,
  CreatePersonalExpenseDto,
  UpdatePersonalExpenseDto,
} from '../types/personalExpense.types';

export const personalExpenseApi = {
  getAll: async (): Promise<PersonalExpense[]> => {
    const res = await apiClient.get<PersonalExpense[]>(API_ENDPOINTS.PERSONAL_EXPENSES.BASE);
    return res.data;
  },

  getById: async (id: string): Promise<PersonalExpense> => {
    const res = await apiClient.get<PersonalExpense>(API_ENDPOINTS.PERSONAL_EXPENSES.BY_ID(id));
    return res.data;
  },

  create: async (dto: CreatePersonalExpenseDto): Promise<PersonalExpense> => {
    const res = await apiClient.post<PersonalExpense>(API_ENDPOINTS.PERSONAL_EXPENSES.BASE, dto);
    return res.data;
  },

  update: async (id: string, dto: UpdatePersonalExpenseDto): Promise<PersonalExpense> => {
    const res = await apiClient.patch<PersonalExpense>(API_ENDPOINTS.PERSONAL_EXPENSES.BY_ID(id), dto);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PERSONAL_EXPENSES.BY_ID(id));
  },
};
