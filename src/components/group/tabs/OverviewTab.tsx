import React from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView } from '../../ui/core';
import { GroupBalanceSummary } from '../GroupBalanceSummary';
import { SettlementCard } from '../SettlementCard';
import { GroupBalance, Settlement, GroupMember } from '../../../services/groupService';
import { BOTTOM_TAB_HEIGHT, spacing } from '../../../constants/spacing';

export interface OverviewTabProps {
  balance: GroupBalance | null;
  settlements: Settlement[];
  members: GroupMember[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  userId: string;
  onAddDeposit: () => void;
  onAddExpense: () => void;
  onSettleUp: (settlement: Settlement) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  balance,
  settlements,
  members,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
  onAddDeposit,
  onAddExpense,
  onSettleUp,
}) => {
  if (isLoading && !balance) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pt-3"
      contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        ) : undefined
      }
    >
      <GroupBalanceSummary
        totalExpenses={balance?.totalExpenses ?? 0}
        totalDeposits={balance?.totalDeposits ?? 0}
        remainingFund={balance?.remainingFund ?? 0}
        yourDeposited={balance?.yourDeposited ?? 0}
        yourSpending={balance?.yourSpending ?? 0}
        yourShare={balance?.yourShare ?? 0}
        netBalance={balance?.netBalance ?? 0}
        totalMembers={members.length || balance?.totalMembers || 1}
        balances={balance?.balances}
        onAddDeposit={onAddDeposit}
      />

      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-1.5 bg-emerald-600 py-2.5 rounded-xl shadow-sm"
          onPress={onAddDeposit}
          activeOpacity={0.8}
        >
          <Feather name="download" size={15} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">+ Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary py-2.5 rounded-xl shadow-sm"
          onPress={onAddExpense}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={15} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">+ Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-1.5 bg-slate-800 py-2.5 rounded-xl shadow-sm"
          onPress={() => {
            if (settlements.length > 0) {
              onSettleUp(settlements[0]);
            }
          }}
          activeOpacity={0.8}
        >
          <Feather name="check-circle" size={15} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Settle Up</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mb-2.5 mt-1">
        <Text className="text-sm font-bold text-foreground">Suggested Settlements</Text>
        <Text className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-blue-200">
          {settlements.length}
        </Text>
      </View>

      {settlements.length > 0 ? (
        <View className="gap-2.5">
          {settlements.map((settlement, index) => (
            <SettlementCard
              key={`${settlement.from.id}-${settlement.to.id}-${index}`}
              settlement={settlement}
              currentUserId={userId}
              onSettle={() => onSettleUp(settlement)}
            />
          ))}
        </View>
      ) : (
        <View className="bg-card rounded-2xl p-6 items-center justify-center border border-dashed border-border">
          <Feather name="check-circle" size={24} color="#10B981" style={{ marginBottom: 6 }} />
          <Text className="text-sm font-bold text-foreground mb-1">All Settled Up! 🎉</Text>
          <Text className="text-xs text-muted-foreground text-center">
            No pending balance transfers or dues needed
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
