import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { InvitationStatusType } from '../types/invitation.types';

export interface InvitationStatusProps {
  status: InvitationStatusType;
}

export const InvitationStatus: React.FC<InvitationStatusProps> = ({ status }) => {
  const map: Record<InvitationStatusType, { label: string; variant: any }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    ACCEPTED: { label: 'Accepted', variant: 'success' },
    REJECTED: { label: 'Declined', variant: 'error' },
    EXPIRED: { label: 'Expired', variant: 'default' },
  };

  const item = map[status] || map.PENDING;

  return <Badge label={item.label} variant={item.variant} />;
};
