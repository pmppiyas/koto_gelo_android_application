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
  paymentSource?: 'GROUP_FUND' | 'PERSONAL';
  paidFrom?: 'GROUP_FUND' | 'PERSONAL';
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
  expenseId?: string | null;
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
  paymentSource?: 'GROUP_FUND' | 'PERSONAL';
  paidFrom?: 'GROUP_FUND' | 'PERSONAL';
  payers?: { userId: string; amount: number }[];
  participants?: { userId: string; shareAmount?: number }[];
}

export interface SettlePaymentPayload {
  groupId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

import { authService } from './authService';

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

let groupApiRefreshPromise: Promise<string | null> | null = null;

async function apiRequest<T>(url: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  const isAuthError =
    res.status === 401 ||
    json?.message?.toLowerCase()?.includes('expired') ||
    json?.message?.toLowerCase()?.includes('invalid token') ||
    json?.message?.toLowerCase()?.includes('unauthorized');

  if (isAuthError) {
    if (!isRetry && !url.includes('/auth/')) {
      if (!groupApiRefreshPromise) {
        groupApiRefreshPromise = authService.refreshToken().finally(() => {
          groupApiRefreshPromise = null;
        });
      }
      const newToken = await groupApiRefreshPromise;
      if (newToken) {
        return apiRequest<T>(url, options, true);
      }
    }
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
    return await apiRequest<Group>(API_ENDPOINTS.GROUP.BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    return await apiRequest<Group>(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteGroup(groupId: string): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'DELETE',
    });
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

  async getGroupBalance(groupId: string, _userId?: string): Promise<GroupBalance> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/balance`);
  },

  async getGroupSummary(groupId: string): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/summary`);
  },

  async getGroupSettlements(groupId: string): Promise<Settlement[]> {
    const result = await apiRequest<any>(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/settlements`);
    return result?.settlements || result || [];
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
    return await apiRequest(API_ENDPOINTS.GROUP.EXPENSES, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async settlePayment(payload: SettlePaymentPayload): Promise<any> {
    return await apiRequest(API_ENDPOINTS.GROUP.SETTLE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteGroupExpense(expenseId: string): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${expenseId}`, {
      method: 'DELETE',
    });
  },

  async getGroupDeposits(groupId?: string, query?: Record<string, any>): Promise<any> {
    let url = groupId && groupId !== 'ALL'
      ? `${API_ENDPOINTS.GROUP.DEPOSITS}/${groupId}`
      : API_ENDPOINTS.GROUP.DEPOSITS;
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v));
        }
      });
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return await apiRequest<any>(url);
  },

  async getGroupDepositSummary(groupId: string): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${groupId}/summary`);
  },

  async addGroupDeposit(payload: CreateGroupDepositPayload): Promise<any> {
    const { user: _user, ...networkPayload } = payload;
    return await apiRequest(API_ENDPOINTS.GROUP.DEPOSITS, {
      method: 'POST',
      body: JSON.stringify(networkPayload),
    });
  },

  async recordDeposit(payload: CreateGroupDepositPayload): Promise<any> {
    return this.addGroupDeposit(payload);
  },

  async updateGroupDeposit(depositId: string, payload: Partial<CreateGroupDepositPayload>): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${depositId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteGroupDeposit(depositId: string): Promise<any> {
    return await apiRequest(`${API_ENDPOINTS.GROUP.DEPOSITS}/${depositId}`, {
      method: 'DELETE',
    });
  },

  async inviteMember(
    groupId: string,
    payload: { username?: string; email?: string; inviteeId?: string } | string,
  ): Promise<any> {
    const body = typeof payload === 'string' ? { username: payload } : payload;
    return apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
