import React from 'react';
import { View, Text } from 'react-native';
import { InvitationStatusType } from '../types/invitation.types';

export interface InvitationStatusProps {
  status: InvitationStatusType;
}

export const InvitationStatus: React.FC<InvitationStatusProps> = ({ status }) => {
  const map: Record<
    InvitationStatusType,
    { label: string; bg: string; text: string; border: string }
  > = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    ACCEPTED: {
      label: 'Accepted',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    REJECTED: {
      label: 'Declined',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-200',
    },
  };

  const item = map[status] || map.PENDING;

  return (
    <View
      className={`px-2.5 py-0.5 rounded-full border ${item.bg} ${item.border}`}
    >
      <Text className={`text-[11px] font-bold ${item.text}`}>{item.label}</Text>
    </View>
  );
};

