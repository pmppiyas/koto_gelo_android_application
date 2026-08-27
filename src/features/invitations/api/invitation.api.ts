import { apiClient } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { Invitation } from '../types/invitation.types';

export const invitationApi = {
  getAll: async (): Promise<Invitation[]> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.INVITATIONS.BASE);
    const rawList =
      res.data?.data?.invitations ||
      res.data?.invitations ||
      (Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : []);

    return rawList.map((item: any) => ({
      id: item.id,
      groupId: item.groupId || item.group?.id,
      groupName: item.group?.name || item.groupName || 'Group',
      groupType: item.group?.type || 'OTHER',
      group: item.group,
      invitedById: item.invitedById,
      inviterName:
        item.invitedBy?.name ||
        item.invitedBy?.username ||
        item.inviterName ||
        'Group Member',
      inviterUsername: item.invitedBy?.username,
      invitedBy: item.invitedBy,
      inviteeId: item.inviteeId,
      invitee: item.invitee,
      inviteeEmail: item.invitee?.email || item.inviteeEmail,
      type: item.type || 'INVITATION',
      status: item.status || 'PENDING',
      createdAt: item.createdAt || new Date().toISOString(),
      respondedAt: item.respondedAt,
    }));
  },

  getById: async (id: string): Promise<Invitation> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.INVITATIONS.BY_ID(id));
    const item = res.data?.data || res.data;
    return {
      id: item.id,
      groupId: item.groupId || item.group?.id,
      groupName: item.group?.name || item.groupName || 'Group',
      groupType: item.group?.type || 'OTHER',
      group: item.group,
      invitedById: item.invitedById,
      inviterName:
        item.invitedBy?.name ||
        item.invitedBy?.username ||
        item.inviterName ||
        'Group Member',
      inviterUsername: item.invitedBy?.username,
      invitedBy: item.invitedBy,
      inviteeId: item.inviteeId,
      invitee: item.invitee,
      inviteeEmail: item.invitee?.email || item.inviteeEmail,
      type: item.type || 'INVITATION',
      status: item.status || 'PENDING',
      createdAt: item.createdAt || new Date().toISOString(),
      respondedAt: item.respondedAt,
    };
  },

  accept: async (id: string): Promise<any> => {
    const res = await apiClient.post(API_ENDPOINTS.INVITATIONS.ACCEPT(id));
    return res.data?.data || res.data;
  },

  reject: async (id: string): Promise<any> => {
    const res = await apiClient.post(API_ENDPOINTS.INVITATIONS.REJECT(id));
    return res.data?.data || res.data;
  },
};

