import { useState, useEffect, useCallback } from 'react';
import { personalExpenseApi } from '../api/personalExpense.api';
import { PersonalExpense, CreatePersonalExpenseDto } from '../types/personalExpense.types';

export const usePersonalExpenses = () => {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await personalExpenseApi.getAll();
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch personal expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = useCallback(async (dto: CreatePersonalExpenseDto) => {
    try {
      setLoading(true);
      const created = await personalExpenseApi.create(dto);
      setExpenses(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
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
