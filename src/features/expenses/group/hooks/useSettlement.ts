import { useState, useEffect, useCallback } from 'react';
import { groupExpenseApi } from '../api/groupExpense.api';
import { SettlementSuggestion } from '../types/settlement.types';

export const useSettlement = (groupId: string) => {
  const [settlements, setSettlements] = useState<SettlementSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettlements = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await groupExpenseApi.getSettlements(groupId);
      setSettlements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settlements');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  return {
    settlements,
    loading,
    error,
    refresh: fetchSettlements,
  };
};
