import { useState, useEffect, useCallback } from 'react';
import { groupExpenseApi } from '../api/groupExpense.api';
import { GroupBalanceSummary } from '../types/balance.types';

export const useGroupBalance = (groupId: string) => {
  const [balanceSummary, setBalanceSummary] = useState<GroupBalanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await groupExpenseApi.getBalances(groupId);
      setBalanceSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balanceSummary,
    loading,
    error,
    refresh: fetchBalances,
  };
};
