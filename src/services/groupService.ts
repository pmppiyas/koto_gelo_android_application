import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';

export interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
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
  id: string;
  title?: string | null;
  amount: number;
  category: string;
  subcategory?: string | null;
  note?: string | null;
  expenseDate: string;
  splitType?: string;
  user: {
    id: string;
    username: string;
    name?: string | null;
  };
  participants?: {
    userId: string;
    shareAmount: number;
    user: { id: string; username: string; name?: string | null };
  }[];
  payers?: {
    userId: string;
    amount: number;
    user: { id: string; username: string; name?: string | null };
  }[];
  createdAt: string;
}

export interface GroupBalance {
  totalExpenses: number;
  totalMembers: number;
  yourSpending: number;
  yourShare: number;
  netBalance: number;
  balances?: {
    userId: string;
    username: string;
    name?: string | null;
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
  participants?: { userId: string; shareAmount: number }[];
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
  if (!res.ok) {
    throw new Error(json?.message || 'Request failed');
  }
  return json?.data || json;
}

export const groupService = {
  async getGroups(query?: Record<string, any>): Promise<any> {
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
    return apiRequest(url);
  },

  async getGroupById(groupId: string): Promise<Group> {
    return apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`);
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    return apiRequest(API_ENDPOINTS.GROUP.BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    return apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteGroup(groupId: string): Promise<any> {
    return apiRequest(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'DELETE',
    });
  },

  async getAllGroupExpenses(query?: Record<string, any>): Promise<any> {
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
    return apiRequest(url);
  },

  async getGroupExpenses(groupId: string, query?: Record<string, any>): Promise<any> {
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
    return apiRequest(url);
  },

  async getGroupBalance(groupId: string): Promise<GroupBalance> {
    return apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/balance`);
  },

  async getGroupSummary(groupId: string): Promise<any> {
    return apiRequest(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/summary`);
  },

  async getGroupSettlements(groupId: string): Promise<Settlement[]> {
    const result = await apiRequest<any>(`${API_ENDPOINTS.GROUP.EXPENSES}/${groupId}/settlements`);
    return result?.settlements || result || [];
  },

  async addGroupExpense(payload: CreateGroupExpensePayload): Promise<any> {
    return apiRequest(API_ENDPOINTS.GROUP.EXPENSES, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async settlePayment(payload: SettlePaymentPayload): Promise<any> {
    return apiRequest(API_ENDPOINTS.GROUP.SETTLE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async inviteMember(groupId: string, inviteeId: string): Promise<any> {
    return apiRequest(API_ENDPOINTS.GROUP.INVITATIONS, {
      method: 'POST',
      body: JSON.stringify({ groupId, inviteeId }),
    });
  },
};
