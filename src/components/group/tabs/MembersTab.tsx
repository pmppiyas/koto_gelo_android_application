import React from 'react';
import {
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../../ui/core';
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
  onInviteMember?: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  balance,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
  onInviteMember,
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
        <View className="bg-card p-4 rounded-2xl border border-border mb-3 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Group Members
              </Text>
              <Text className="text-lg font-extrabold text-foreground mt-0.5">
                {members.length} {members.length === 1 ? 'Person' : 'People'}
              </Text>
            </View>
            {onInviteMember && (
              <TouchableOpacity
                className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2 rounded-xl shadow-sm"
                onPress={onInviteMember}
                activeOpacity={0.8}
              >
                <Feather name="user-plus" size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">+ Invite Member</Text>
              </TouchableOpacity>
            )}
          </View>
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
      ListFooterComponent={
        members.length > 0 && onInviteMember ? (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 bg-card border border-dashed border-primary/40 p-3.5 rounded-2xl mt-3"
            onPress={onInviteMember}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={16} color="#2563EB" />
            <Text className="text-xs font-bold text-primary">Invite More Members</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={
        <View className="bg-card rounded-2xl p-6 items-center justify-center border border-dashed border-border mt-4">
          <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center mb-3 border border-blue-200">
            <Feather name="users" size={22} color="#2563EB" />
          </View>
          <Text className="text-sm font-bold text-foreground mb-1">No Members Found</Text>
          <Text className="text-xs text-muted-foreground text-center mb-4">
            Invite roommates or friends to join this group by username.
          </Text>
          {onInviteMember && (
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-primary px-5 py-2.5 rounded-xl shadow-sm"
              onPress={onInviteMember}
              activeOpacity={0.8}
            >
              <Feather name="user-plus" size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">+ Invite Member</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );
};
