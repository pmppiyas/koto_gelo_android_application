import { useState, useEffect, useCallback } from 'react';
import { invitationApi } from '../api/invitation.api';
import { Invitation } from '../types/invitation.types';

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invitationApi.getAll();
      setInvitations(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(async (id: string) => {
    try {
      setActionLoadingId(id);
      await invitationApi.accept(id);
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === id ? { ...inv, status: 'ACCEPTED' as const } : inv,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  const rejectInvitation = useCallback(async (id: string) => {
    try {
      setActionLoadingId(id);
      await invitationApi.reject(id);
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === id ? { ...inv, status: 'REJECTED' as const } : inv,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to reject invitation');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    actionLoadingId,
    error,
    refresh: fetchInvitations,
    acceptInvitation,
    rejectInvitation,
  };
};
