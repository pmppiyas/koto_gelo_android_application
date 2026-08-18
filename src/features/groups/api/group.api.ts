import { apiClient } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { Group, CreateGroupDto, UpdateGroupDto } from '../types/group.types';

export const groupApi = {
  getAll: async (): Promise<Group[]> => {
    const res = await apiClient.get<Group[]>(API_ENDPOINTS.GROUPS.BASE);
    return res.data;
  },

  getById: async (id: string): Promise<Group> => {
    const res = await apiClient.get<Group>(API_ENDPOINTS.GROUPS.BY_ID(id));
    return res.data;
  },

  create: async (dto: CreateGroupDto): Promise<Group> => {
    const res = await apiClient.post<Group>(API_ENDPOINTS.GROUPS.BASE, dto);
    return res.data;
  },

  update: async (id: string, dto: UpdateGroupDto): Promise<Group> => {
    const res = await apiClient.patch<Group>(API_ENDPOINTS.GROUPS.BY_ID(id), dto);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.GROUPS.BY_ID(id));
  },
};
