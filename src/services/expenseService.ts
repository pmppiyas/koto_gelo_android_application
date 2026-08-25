import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';
import { LocalExpense } from '../features/expenses/expense.types';
import { formatExpenseDateForServer } from '../utils/date';
import { handleUnauthorized } from '../utils/authEvents';
import { expenseRepository } from './database/repositories/expense.repository';

async function checkResponse(res: Response): Promise<any> {
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
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json?.data || json;
}

export const expenseService = {
  async getAuthHeaders(localId?: string): Promise<Record<string, string>> {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (localId) {
      headers['Idempotency-Key'] = localId;
    }
    return headers;
  },

  async createPersonalExpense(expense: LocalExpense): Promise<any> {
    const headers = await this.getAuthHeaders(expense.localId);
    const payload = {
      amount: Number(expense.amount),
      category: expense.category,
      subcategory: expense.subcategory || undefined,
      title: expense.title || undefined,
      note: expense.note || undefined,
      expenseDate: formatExpenseDateForServer(expense.date),
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
    try {
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
    } catch {
      // Fallback to SQLite
      const stored = await expenseRepository.getAll();
      return { expenses: stored, data: { expenses: stored } };
    }
  },

  async getPersonalExpenseSummary(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(API_ENDPOINTS.EXPENSES.SUMMARY, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      return await checkResponse(res);
    } catch {
      const stored = await expenseRepository.getAll();
      const total = stored.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return { totalExpenses: total, count: stored.length };
    }
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
