import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';

export interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE';
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

export interface CreateGroupPayload {
  name: string;
  description?: string;
  type?: 'MESS' | 'FRIENDS' | 'TOUR' | 'TRIP' | 'FAMILY' | 'OFFICE' | 'STUDENTS' | 'ROOMMATES' | 'OTHER';
}

export const groupService = {
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  async getGroups(query?: Record<string, any>): Promise<any> {
    const headers = await this.getAuthHeaders();
    let url = API_ENDPOINTS.GROUP.BASE;
    if (query) {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to fetch groups');
    }
    return json?.data || json;
  },

  async getGroupById(groupId: string): Promise<Group> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to fetch group details');
    }
    return json?.data || json;
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(API_ENDPOINTS.GROUP.BASE, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to create group');
    }
    return json?.data || json;
  },

  async updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to update group');
    }
    return json?.data || json;
  },

  async deleteGroup(groupId: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.GROUP.BASE}/${groupId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to delete group');
    }
    return json?.data || json;
  },
};
