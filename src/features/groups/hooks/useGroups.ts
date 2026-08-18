import { useState, useEffect, useCallback } from 'react';
import { groupApi } from '../api/group.api';
import { Group, CreateGroupDto } from '../types/group.types';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupApi.getAll();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const addGroup = useCallback(async (dto: CreateGroupDto) => {
    try {
      setLoading(true);
      const created = await groupApi.create(dto);
      setGroups(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
    addGroup,
  };
};
