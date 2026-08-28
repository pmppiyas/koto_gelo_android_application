import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';
import { GroupDeposit, GroupMember } from '../../services/groupService';

export interface GroupDepositCardProps {
  deposit: GroupDeposit;
  currentUserId: string;
  members?: GroupMember[];
  onDelete?: (id: string) => void;
}

const METHOD_STYLES: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  CASH: { label: 'Cash', icon: 'dollar-sign', color: '#16A34A', bg: 'bg-emerald-50 text-emerald-700' },
  BKASH: { label: 'bKash', icon: 'smartphone', color: '#E11D48', bg: 'bg-rose-50 text-rose-700' },
  NAGAD: { label: 'Nagad', icon: 'zap', color: '#EA580C', bg: 'bg-amber-50 text-amber-700' },
  ROCKET: { label: 'Rocket', icon: 'send', color: '#8B5CF6', bg: 'bg-purple-50 text-purple-700' },
  BANK: { label: 'Bank', icon: 'credit-card', color: '#2563EB', bg: 'bg-blue-50 text-blue-700' },
  OTHER: { label: 'Other', icon: 'folder', color: '#6B7280', bg: 'bg-slate-100 text-slate-700' },
};

export const GroupDepositCard: React.FC<GroupDepositCardProps> = ({
  deposit,
  currentUserId,
  members,
  onDelete,
}) => {
  const isYou = deposit.userId === currentUserId;
  const isRecorder = deposit.recordedById === currentUserId;

  const matchedMember = members?.find(
    (m) => m.userId === deposit.userId || m.user?.id === deposit.userId
  );

  const username =
    deposit.user?.username ||
    matchedMember?.user?.username ||
    (deposit as any).username;
  const fullName =
    deposit.user?.name ||
    matchedMember?.user?.name ||
    (deposit as any).name;

  const memberName = isYou ? 'You' : fullName || (username ? `@${username}` : 'Member');
  const initial = (fullName || username || 'U').charAt(0).toUpperCase();
  const methodInfo = METHOD_STYLES[deposit.method] || METHOD_STYLES.CASH;

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  return (
    <View className="flex-row items-center justify-between bg-card py-3 px-3.5 rounded-xl border border-border shadow-sm">
      <View className="flex-row items-center flex-1 pr-2 gap-2.5">
        <View className="w-9 h-9 rounded-full bg-emerald-100 items-center justify-center">
          <Text className="text-xs font-bold text-emerald-700">{initial}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Text
              className={`text-sm font-bold ${
                isYou ? 'text-primary' : 'text-card-foreground'
              }`}
              numberOfLines={1}
            >
              {memberName}
            </Text>
            <View className={`flex-row items-center gap-1 px-1.5 py-0.5 rounded ${methodInfo.bg}`}>
              <Feather name={methodInfo.icon} size={10} color={methodInfo.color} />
              <Text className="text-[10px] font-bold">{methodInfo.label}</Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground">
            {formatDate(deposit.depositDate || deposit.createdAt)}
            {deposit.note ? ` • ${deposit.note}` : ''}
          </Text>
        </View>
      </View>

      <View className="items-end gap-1">
        <Text className="text-sm font-extrabold text-emerald-600">
          +৳{Number(deposit.amount).toLocaleString()}
        </Text>
        {isRecorder && onDelete && (
          <TouchableOpacity
            className="p-1"
            onPress={() => onDelete(deposit.id)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={13} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
