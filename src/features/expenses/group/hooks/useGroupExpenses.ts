import { useState, useEffect, useCallback } from 'react';
import { groupExpenseApi } from '../api/groupExpense.api';
import { GroupExpense, CreateGroupExpenseDto } from '../types/groupExpense.types';

export const useGroupExpenses = (groupId: string) => {
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await groupExpenseApi.getAll(groupId);
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch group expenses');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const addExpense = useCallback(async (dto: CreateGroupExpenseDto) => {
    try {
      setLoading(true);
      const created = await groupExpenseApi.create(dto);
      setExpenses(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to add group expense');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    refresh: fetchExpenses,
    addExpense,
  };
};
