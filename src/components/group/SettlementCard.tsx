import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';
import { Settlement } from '../../services/groupService';

interface SettlementCardProps {
  settlement?: Settlement;
  fromName?: string;
  toName?: string;
  amount?: number;
  isYouFrom?: boolean;
  isYouTo?: boolean;
  currentUserId?: string;
  onSettle?: () => void;
}

const getInitial = (name: string): string => {
  return (name || 'U').charAt(0).toUpperCase();
};

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlement,
  fromName,
  toName,
  amount,
  isYouFrom,
  isYouTo,
  currentUserId,
  onSettle,
}) => {
  const fName = settlement?.from.name || settlement?.from.username || fromName || 'User';
  const tName = settlement?.to.name || settlement?.to.username || toName || 'User';
  const amt = settlement?.amount ?? amount ?? 0;

  const isFrom = currentUserId ? settlement?.from.id === currentUserId : (isYouFrom ?? false);
  const isTo = currentUserId ? settlement?.to.id === currentUserId : (isYouTo ?? false);

  const displayFrom = isFrom ? 'You' : fName;
  const displayTo = isTo ? 'You' : tName;
  const showSettleButton = (isFrom || isTo) && onSettle;

  return (
    <View className="bg-card border border-border rounded-xl p-3 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center border border-rose-100">
              <Text className="text-xs font-bold text-destructive">{getInitial(fName)}</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#94A3B8" />
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center border border-emerald-100">
              <Text className="text-xs font-bold text-emerald-600">{getInitial(tName)}</Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground font-medium">
            <Text className={isFrom ? 'font-bold text-destructive' : ''}>{displayFrom}</Text>
            {' → '}
            <Text className={isTo ? 'font-bold text-emerald-600' : ''}>{displayTo}</Text>
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-sm font-extrabold text-primary">৳{amt.toLocaleString()}</Text>
          {showSettleButton && (
            <TouchableOpacity
              className="bg-primary rounded-full px-3 py-1 mt-1 shadow-sm"
              onPress={onSettle}
              activeOpacity={0.8}
            >
              <Text className="text-primary-foreground text-[11px] font-bold">Settle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
