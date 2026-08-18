import { apiClient } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { Invitation } from '../types/invitation.types';

export const invitationApi = {
  getAll: async (): Promise<Invitation[]> => {
    const res = await apiClient.get<Invitation[]>(API_ENDPOINTS.INVITATIONS.BASE);
    return res.data;
  },

  getById: async (id: string): Promise<Invitation> => {
    const res = await apiClient.get<Invitation>(API_ENDPOINTS.INVITATIONS.BY_ID(id));
    return res.data;
  },

  accept: async (id: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.INVITATIONS.ACCEPT(id));
  },

  reject: async (id: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.INVITATIONS.REJECT(id));
  },
};
