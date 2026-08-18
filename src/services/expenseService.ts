import { API_ENDPOINTS } from '../config/api';
import { storage, STORAGE_KEYS } from '../config/storage';
import { LocalExpense } from '../features/expenses/expense.types';
import { formatExpenseDateForServer } from '../utils/date';

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

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.message || `Failed to create expense (${res.status})`);
    }

    return json?.data || json;
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

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to fetch expenses');
    }
    return json?.data || json;
  },

  async getPersonalExpenseSummary(): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(API_ENDPOINTS.EXPENSES.SUMMARY, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to fetch summary');
    }
    return json?.data || json;
  },

  async deletePersonalExpense(id: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.EXPENSES.PERSONAL}/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to delete expense');
    }
    return json?.data || json;
  },

  async updatePersonalExpense(id: string, data: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_ENDPOINTS.EXPENSES.PERSONAL}/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to update expense');
    }
    return json?.data || json;
  },
};
