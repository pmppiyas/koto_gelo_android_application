import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';
import { handleUnauthorized } from '../utils/authEvents';
import { localGroupService } from './localGroupService';
import { syncQueue } from './sync/syncQueue';

export interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'OWNER';
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt?: string;
  user: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  type: 'MESS' | 'FRIENDS' | 'TOUR' | 'TRIP' | 'FAMILY' | 'OFFICE' | 'STUDENTS' | 'ROOMMATES' | 'OTHER';
  status: 'ACTIVE' | 'ARCHIVED';
  createdById: string;
  createdBy?: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  members?: GroupMember[];
  _count?: {
    members: number;
    expenses: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GroupExpense {
  groupId?: string;
  id: string;
  title?: string | null;
  amount: number;
  category: string;
  subcategory?: string | null;
  note?: string | null;
  expenseDate: string;
  splitType?: string;
  userId?: string;
  user: {
    id: string;
    username: string;
    name?: string | null;
  };
  participants?: {
    userId: string;
    shareAmount: number;
    user?: { id: string; username: string; name?: string | null };
  }[];
  payers?: {
    userId: string;
    amount: number;
    user?: { id: string; username: string; name?: string | null };
  }[];
  createdAt: string;
}

export interface GroupDeposit {
  id: string;
  groupId: string;
  userId: string;
  recordedById: string;
  amount: number;
  depositDate: string;
  method: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER';
  note?: string | null;
  status: 'ACTIVE' | 'CANCELLED';
  user: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  recordedBy?: {
    id: string;
    username: string;
    name?: string | null;
  };
  group?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

export interface GroupBalance {
  totalExpenses: number;
  totalDeposits?: number;
  remainingFund?: number;
  totalMembers: number;
  yourDeposited?: number;
  yourSpending: number;
  yourShare: number;
  netBalance: number;
  balances?: {
    userId: string;
    username: string;
    name?: string | null;
    totalDeposited?: number;
    paid: number;
    owes: number;
    net: number;
  }[];
}

export interface Settlement {
  from: { id: string; username: string; name?: string | null };
  to: { id: string; username: string; name?: string | null };
  amount: number;
}

export interface CreateGroupDepositPayload {
  groupId: string;
  userId: string;
  amount: number;
  depositDate?: string;
  method?: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER';
  note?: string;
  user?: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  type?: 'MESS' | 'FRIENDS' | 'TOUR' | 'TRIP' | 'FAMILY' | 'OFFICE' | 'STUDENTS' | 'ROOMMATES' | 'OTHER';
}

export interface CreateGroupExpensePayload {
  groupId: string;
  title?: string;
  amount: number;
  category: string;
  subcategory?: string;
  note?: string;
  expenseDate: string;
  splitType?: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  participants?: { userId: string; shareAmount?: number }[];
}

export interface SettlePaymentPayload {
  groupId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (
    res.status === 401 ||
    json?.message?.toLowerCase()?.includes('expired') ||
    json?.message?.toLowerCase()?.includes('invalid token') ||
    json?.message?.toLowerCase()?.includes('unauthorized')
  ) {
    handleUnauthorized();
    throw new Error(json?.message || 'Session expired. Please sign in again.');
  }
  if (!res.ok) {
    throw new Error(json?.message || 'Request failed');
  }
  return json?.data || json;
}

export const groupService = {
  async getGroups(query?: Record<string, any>): Promise<any> {
    try {
      let url = API_ENDPOINTS.GROUP.BASE;
      if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, String(v));
          }
        });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }
      const remoteData = await apiRequest<any>(url);
      const groupsList =
        remoteData?.data?.groups ||
        remoteData?.groups ||
        (Array.isArray(remoteData?.data) ? remoteData.data : Array.isArray(remoteData) ? remoteData : []);
      if (Array.isArray(groupsList) && groupsList.length > 0) {
        await localGroupService.setStoredGroups(groupsList);
      }
      return { groups: groupsList, data: { groups: groupsList }, ...remoteData };
    } catch {
      // Fallback to SQLite
      const stored = await localGroupService.getStoredGroups();
      return { groups: stored, data: { groups: stored } };
    }
  },

  async getGroupById(groupId: string): Promise<Group> {
    try {
      const res = await apiRequest<any>(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`);
      const groupData = res?.data || res;
      if (groupData && groupData.id) {
        await localGroupService.saveGroupLocally(groupData, 'synced');
      }
      return groupData;
    } catch {
      const local = await localGroupService.getStoredGroupById(groupId);
      if (local) return local;
      throw new Error('Group not found offline');
    }
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const tempId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const optimisticGroup: Group = {
      id: tempId,
      name: payload.name,
      description: payload.description || null,
      type: payload.type || 'MESS',
      status: 'ACTIVE',
      createdById: 'you',
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to SQLite
    await localGroupService.saveGroupLocally(optimisticGroup, 'pending');

    try {
      const serverGroup = await apiRequest<Group>(API_ENDPOINTS.GROUP.BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Update SQLite with confirmed server group
      await localGroupService.deleteGroupLocally(tempId);
      await localGroupService.saveGroupLocally(serverGroup, 'synced');
      return serverGroup;
    } catch {
      // Offline -> queue creation
      await syncQueue.addToQueue({
        action: 'CREATE_GROUP',
        entityType: 'GROUP',
        payload,
      });
      return optimisticGroup;
    }
  },

  async updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    await localGroupService.saveGroupLocally({ id: groupId, ...payload } as any, 'pending');

    try {
      const updated = await apiRequest<Group>(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await localGroupService.saveGroupLocally(updated, 'synced');
      return updated;
    } catch {
      await syncQueue.addToQueue({
        action: 'UPDATE_GROUP',
        entityType: 'GROUP',
        payload: { id: groupId, data: payload },
      });
      const local = await localGroupService.getStoredGroupById(groupId);
      return local || ({ id: groupId, ...payload } as any);
    }
  },

  async deleteGroup(groupId: string): Promise<any> {
    await localGroupService.deleteGroupLocally(groupId);

    try {
      return await apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
        method: 'DELETE',
      });
    } catch {
      await syncQueue.addToQueue({
        action: 'DELETE_GROUP',
        entityType: 'GROUP',
        payload: { id: groupId },
      });
      return { success: true };
    }
  },

  async getAllGroupExpenses(query?: Record<string, any>): Promise<any> {
    try {
      let url = API_ENDPOINTS.GROUP.EXPENSES;
      if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, String(v));
          }
        });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }
      const remote = await apiRequest<any>(url);
      const exps = remote?.expenses || (Array.isArray(remote) ? remote : []);
      if (Array.isArray(exps)) {
        await localGroupService.setStoredGroupExpenses(exps);
      }
      return remote;
    } catch {
      const stored = await localGroupService.getStoredGroupExpenses();
      return { expenses: stored, data: { expenses: stored } };
    }
  },

  async getGroupExpenses(groupId: string, query?: Record<string, any>): Promise<any> {
    try {
      let url = `${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/history`;
      if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, String(v));
          }
        });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }
      const remote = await apiRequest<any>(url);
      const exps =
        remote?.data?.history ||
        remote?.data?.expenses ||
        remote?.history ||
        remote?.expenses ||
        (Array.isArray(remote?.data) ? remote.data : Array.isArray(remote) ? remote : []);
      if (Array.isArray(exps) && exps.length > 0) {
        await localGroupService.setStoredGroupExpenses(exps);
      }
      return { history: exps, expenses: exps, data: { history: exps, expenses: exps }, ...remote };
    } catch {
      const stored = await localGroupService.getStoredGroupExpenses(groupId);
      return { history: stored, expenses: stored, data: { history: stored } };
    }
  },

  async getOverallGroupSummary(): Promise<{
    totalGroupExpenses: number;
    totalPaidByMe: number;
    totalMyShare: number;
    netBalance: number;
  }> {
    try {
      return await apiRequest(API_ENDPOINTS.GROUP.SUMMARY);
    } catch {
      const allExpenses = await localGroupService.getStoredGroupExpenses();
      const total = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return {
        totalGroupExpenses: total,
        totalPaidByMe: 0,
        totalMyShare: 0,
        netBalance: 0,
      };
    }
  },

  async getGroupBalance(groupId: string): Promise<GroupBalance> {
    try {
      return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/balance`);
    } catch {
      return await localGroupService.calculateOfflineGroupBalance(groupId);
    }
  },

  async getGroupSummary(groupId: string): Promise<any> {
    try {
      return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/summary`);
    } catch {
      return await localGroupService.calculateOfflineGroupSummary(groupId);
    }
  },

  async getGroupSettlements(groupId: string): Promise<Settlement[]> {
    try {
      const result = await apiRequest<any>(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/settlements`);
      return result?.settlements || result || [];
    } catch {
      return await localGroupService.calculateOfflineSettlements(groupId);
    }
  },

  async getSettlementPlan(groupId: string): Promise<{ settlements: Settlement[] }> {
    const list = await this.getGroupSettlements(groupId);
    return { settlements: list };
  },

  async settleDebt(groupId: string, payload: { toUserId: string; amount: number; note?: string }): Promise<any> {
    return this.settlePayment({
      groupId,
      toUserId: payload.toUserId,
      amount: payload.amount,
      note: payload.note,
    });
  },

  async addGroupExpense(payload: CreateGroupExpensePayload): Promise<any> {
    const localId = `lge_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const optimistic = {
      id: localId,
      localId,
      groupId: payload.groupId,
      amount: payload.amount,
      category: payload.category,
      subcategory: payload.subcategory || null,
      title: payload.title || null,
      note: payload.note || null,
      expenseDate: payload.expenseDate,
      splitType: payload.splitType || 'EQUAL',
      participants: payload.participants || [],
      createdAt: new Date().toISOString(),
    };

    // 1. INSTANT LOCAL SAVE (0ms) - writes to SQLite immediately
    await localGroupService.saveGroupExpenseLocally(optimistic, 'pending');

    // 2. BACKGROUND ASYNC SYNC (Non-blocking)
    (async () => {
      try {
        const serverRes = await apiRequest(API_ENDPOINTS.GROUP.EXPENSES, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const serverId =
          serverRes?.data?.id || serverRes?.id || serverRes?.expense?.id;
        if (serverId) {
          await localGroupService.saveGroupExpenseLocally(
            { ...optimistic, serverId, id: serverId },
            'synced',
          );
        }
      } catch {
        await syncQueue.addToQueue({
          action: 'CREATE_GROUP_EXPENSE',
          entityType: 'EXPENSE',
          payload: { ...payload, localId },
        });
      }
    })();

    return optimistic;
  },

  async settlePayment(payload: SettlePaymentPayload): Promise<any> {
    try {
      return await apiRequest(API_ENDPOINTS.GROUP.SETTLE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      await syncQueue.addToQueue({
        action: 'SETTLE_PAYMENT',
        entityType: 'SETTLEMENT',
        payload,
      });
      return { success: true };
    }
  },

  async deleteGroupExpense(expenseId: string): Promise<any> {
    await localGroupService.deleteGroupExpenseLocally(expenseId);

    try {
      return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${expenseId}`, {
        method: 'DELETE',
      });
    } catch {
      await syncQueue.addToQueue({
        action: 'DELETE_GROUP_EXPENSE',
        entityType: 'EXPENSE',
        payload: { id: expenseId },
      });
      return { success: true };
    }
  },

  async getGroupDeposits(groupId?: string, query?: Record<string, any>): Promise<any> {
    try {
      let url = API_ENDPOINTS.GROUP.DEPOSITS;
      const params = new URLSearchParams();
      if (groupId && groupId !== 'ALL') {
        params.append('groupId', groupId);
      }
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, String(v));
          }
        });
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      const remote = await apiRequest<any>(url);
      const deps =
        remote?.data?.deposits ||
        remote?.deposits ||
        (Array.isArray(remote?.data) ? remote.data : Array.isArray(remote) ? remote : []);
      if (Array.isArray(deps) && deps.length > 0) {
        await localGroupService.setStoredGroupDeposits(deps);
      }
      return { deposits: deps, data: { deposits: deps }, ...remote };
    } catch {
      const stored = await localGroupService.getStoredGroupDeposits(groupId);
      return { deposits: stored, data: { deposits: stored } };
    }
  },

  async getGroupDepositSummary(groupId: string): Promise<any> {
    try {
      return await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${groupId}/summary`);
    } catch {
      const deposits = await localGroupService.getStoredGroupDeposits(groupId);
      const total = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      return { totalGroupDeposit: total, groupId };
    }
  },

  async addGroupDeposit(payload: CreateGroupDepositPayload): Promise<any> {
    const localId = `lgd_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    
    // Resolve user object for instant offline display
    let userObj = payload.user;
    if (!userObj) {
      const storedGroup = await localGroupService.getStoredGroupById(payload.groupId).catch(() => null);
      const member = storedGroup?.members?.find(
        (m: any) => m.userId === payload.userId || m.user?.id === payload.userId
      );
      if (member) {
        userObj = {
          id: member.userId || member.user?.id,
          username: member.user?.username || (member as any).username || 'Member',
          name: member.user?.name || (member as any).name || null,
          avatarUrl: member.user?.avatarUrl || null,
        };
      }
    }

    const optimistic = {
      id: localId,
      localId,
      groupId: payload.groupId,
      userId: payload.userId,
      amount: payload.amount,
      depositDate: payload.depositDate || new Date().toISOString(),
      method: payload.method || 'CASH',
      note: payload.note || null,
      status: 'ACTIVE',
      user: userObj || {
        id: payload.userId,
        username: 'Member',
        name: null,
      },
      createdAt: new Date().toISOString(),
    };

    // 1. INSTANT LOCAL SAVE (0ms) - writes to SQLite immediately
    await localGroupService.saveGroupDepositLocally(optimistic, 'pending');

    // 2. BACKGROUND ASYNC SYNC (Non-blocking)
    (async () => {
      try {
        const { user, ...networkPayload } = payload;
        const serverRes = await apiRequest(API_ENDPOINTS.GROUP.DEPOSITS, {
          method: 'POST',
          body: JSON.stringify(networkPayload),
        });
        const serverId =
          serverRes?.data?.id || serverRes?.id || serverRes?.deposit?.id;
        const serverUser =
          serverRes?.data?.user || serverRes?.user || serverRes?.deposit?.user || userObj;
        if (serverId) {
          await localGroupService.saveGroupDepositLocally(
            { ...optimistic, serverId, id: serverId, user: serverUser },
            'synced',
          );
        }
      } catch {
        await syncQueue.addToQueue({
          action: 'CREATE_GROUP_DEPOSIT',
          entityType: 'DEPOSIT',
          payload: { ...payload, localId },
        });
      }
    })();

    return optimistic;
  },

  async updateGroupDeposit(depositId: string, payload: Partial<CreateGroupDepositPayload>): Promise<any> {
    await localGroupService.saveGroupDepositLocally({ id: depositId, ...payload }, 'pending');

    (async () => {
      try {
        await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${depositId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } catch {
        await syncQueue.addToQueue({
          action: 'UPDATE_GROUP_DEPOSIT',
          entityType: 'DEPOSIT',
          payload: { id: depositId, data: payload },
        });
      }
    })();

    return { id: depositId, ...payload };
  },

  async deleteGroupDeposit(depositId: string): Promise<any> {
    await localGroupService.deleteGroupDepositLocally(depositId);

    (async () => {
      try {
        await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${depositId}`, {
          method: 'DELETE',
        });
      } catch {
        await syncQueue.addToQueue({
          action: 'DELETE_GROUP_DEPOSIT',
          entityType: 'DEPOSIT',
          payload: { id: depositId },
        });
      }
    })();

    return { success: true };
  },

  async inviteMember(groupId: string, inviteeId: string): Promise<any> {
    return apiRequest(API_ENDPOINTS.GROUP.INVITATIONS, {
      method: 'POST',
      body: JSON.stringify({ groupId, inviteeId }),
    });
  },
};
