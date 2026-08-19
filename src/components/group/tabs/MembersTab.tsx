import React from 'react';
import {
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { View, Text } from '../../ui/core';
import { GroupMemberRow } from '../GroupMemberRow';
import { GroupMember, GroupBalance } from '../../../services/groupService';
import { BOTTOM_TAB_HEIGHT, spacing } from '../../../constants/spacing';

export interface MembersTabProps {
  members: GroupMember[];
  balance: GroupBalance | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  userId: string;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  balance,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
}) => {
  if (isLoading && members.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const balanceMap = new Map<string, number>();
  if (balance?.balances) {
    for (const b of balance.balances) {
      balanceMap.set(b.userId, b.net);
    }
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
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
      ListHeaderComponent={
        <View className="flex-row items-center justify-between bg-card p-3.5 rounded-xl border border-border mb-3 shadow-sm">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Members
          </Text>
          <Text className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-blue-200">
            {members.length} people
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isYou = item.userId === userId;
        const net = balanceMap.get(item.userId);

        return (
          <GroupMemberRow
            name={item.user.name || item.user.username}
            username={item.user.username}
            role={item.role}
            isYou={isYou}
            netBalance={net}
          />
        );
      }}
      ListEmptyComponent={
        <View className="bg-card rounded-2xl p-6 items-center justify-center border border-dashed border-border mt-4">
          <Text className="text-sm font-bold text-foreground mb-1">No Members Found</Text>
          <Text className="text-xs text-muted-foreground text-center">
            Invite roommates or friends to join this group.
          </Text>
        </View>
      }
    />
  );
};
