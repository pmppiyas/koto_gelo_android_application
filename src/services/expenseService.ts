import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';
import { LocalExpense } from '../store/expense.types';
import { formatExpenseDateForServer } from '../utils/date';
import { handleUnauthorized } from '../utils/authEvents';
import { authService } from './authService';

let expenseRefreshPromise: Promise<string | null> | null = null;

async function checkResponse(res: Response): Promise<any> {
  const json = await res.json().catch(() => null);
  const isAuthError =
    res.status === 401 ||
    json?.message?.toLowerCase()?.includes('expired') ||
    json?.message?.toLowerCase()?.includes('invalid token') ||
    json?.message?.toLowerCase()?.includes('unauthorized');

  if (isAuthError) {
    if (!expenseRefreshPromise) {
      expenseRefreshPromise = authService.refreshToken().finally(() => {
        expenseRefreshPromise = null;
      });
    }
    const newToken = await expenseRefreshPromise;
    if (!newToken) {
      handleUnauthorized();
      throw new Error(json?.message || 'Session expired. Please sign in again.');
    }
    return json?.data || json;
  }
  if (!res.ok) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json?.data || json;
}

export const expenseService = {
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

  async createPersonalExpense(expense: LocalExpense): Promise<any> {
    const headers = await this.getAuthHeaders();
    const payload = {
      amount: Number(expense.amount),
      category: expense.category,
      subcategory: expense.subcategory || undefined,
      title: expense.title || undefined,
      note: expense.note || undefined,
      expenseDate: formatExpenseDateForServer(expense.date || expense.expenseDate),
    };

    const res = await fetch(API_ENDPOINTS.EXPENSES.PERSONAL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return checkResponse(res);
  },

  async getPersonalExpenses(query?: Record<string, any>): Promise<any> {
    const headers = await this.getAuthHeaders();
    let url = API_ENDPOINTS.EXPENSES.PERSONAL;
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

    return await checkResponse(res);
  },

  async getPersonalExpenseSummary(): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(API_ENDPOINTS.EXPENSES.SUMMARY, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    return await checkResponse(res);
  },

  async deletePersonalExpense(id: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.EXPENSES.PERSONAL}/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    return checkResponse(res);
  },

  async updatePersonalExpense(id: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.EXPENSES.PERSONAL}/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return checkResponse(res);
  },
};
