import React, { useState, useEffect, useCallback } from 'react';
import {
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from '../components/ui/core';
import {
  groupService,
  Group,
  GroupExpense,
  GroupBalance,
  Settlement,
} from '../services/groupService';
import { useAuth } from '../store/hooks';
import { OverviewTab } from '../components/group/tabs/OverviewTab';
import { DepositsTab } from '../components/group/tabs/DepositsTab';
import { ExpensesTab } from '../components/group/tabs/ExpensesTab';
import { SettlementsTab } from '../components/group/tabs/SettlementsTab';
import { MembersTab } from '../components/group/tabs/MembersTab';
import { AddGroupExpenseModal } from '../components/group/AddGroupExpenseModal';
import { AddGroupDepositModal } from '../components/group/AddGroupDepositModal';
import { InviteMemberModal } from '../components/group/InviteMemberModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

const TYPE_EMOJI: Record<string, string> = {
  MESS: '🍲',
  FRIENDS: '👥',
  TOUR: '🎒',
  TRIP: '✈️',
  FAMILY: '👨‍👩‍👧',
  OFFICE: '💼',
  ROOMMATES: '🏠',
  STUDENTS: '🎓',
  OTHER: '📁',
};

const TABS = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Deposits', label: 'Deposits' },
  { id: 'Expenses', label: 'Expenses' },
  { id: 'Settlements', label: 'Settlements' },
  { id: 'Members', label: 'Members' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export interface GroupDetailsScreenProps {
  groupId: string;
  onNavigateBack: () => void;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  groupId,
  onNavigateBack,
}) => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [group, setGroup] = useState<Group | null>(null);
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [settlingTarget, setSettlingTarget] = useState<Settlement | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [groupRes, balRes, expRes, setRes] = await Promise.allSettled([
        groupService.getGroupById(groupId),
        groupService.getGroupBalance(groupId, userId),
        groupService.getGroupExpenses(groupId, { limit: 50 }),
        groupService.getSettlementPlan(groupId),
      ]);

      if (groupRes.status === 'fulfilled') setGroup(groupRes.value);
      if (balRes.status === 'fulfilled') setBalance(balRes.value);
      if (expRes.status === 'fulfilled') {
        const val = expRes.value;
        const list =
          val?.history ||
          val?.data?.history ||
          val?.expenses ||
          val?.data?.expenses ||
          (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        setExpenses(list);
      }
      if (setRes.status === 'fulfilled') setSettlements(setRes.value?.settlements || []);
    } catch {} finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = () => {
    fetchAllData(true);
  };

  const handleSettleConfirm = async () => {
    if (!settlingTarget) return;
    setIsSettling(true);
    try {
      await groupService.settleDebt(groupId, {
        toUserId: settlingTarget.to.id,
        amount: settlingTarget.amount,
      });
      setSettlingTarget(null);
      fetchAllData(true);
    } catch {} finally {
      setIsSettling(false);
    }
  };

  const emoji = group?.type ? TYPE_EMOJI[group.type] || '📁' : '📁';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
        <TouchableOpacity
          onPress={onNavigateBack}
          className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-2"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#0F172A" />
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base">{emoji}</Text>
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {group?.name || 'Group Details'}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {group?.members?.length || 1} member{group?.members?.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {activeTab === 'Members' ? (
            <TouchableOpacity
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary shadow-sm"
              onPress={() => setIsInviteModalOpen(true)}
              activeOpacity={0.7}
            >
              <Feather name="user-plus" size={14} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">+ Invite Member</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200"
                onPress={() => setIsDepositModalOpen(true)}
                activeOpacity={0.7}
              >
                <Feather name="download" size={16} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-primary items-center justify-center shadow-sm"
                onPress={() => setIsExpenseModalOpen(true)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View className="bg-card border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3 py-2 gap-1.5"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                className={`px-3.5 py-1.5 rounded-full ${
                  isActive ? 'bg-primary' : 'bg-muted'
                }`}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !group ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-xs text-muted-foreground">Loading group data...</Text>
        </View>
      ) : (
        <View className="flex-1">
          {activeTab === 'Overview' && (
            <OverviewTab
              balance={balance}
              settlements={settlements}
              members={group?.members || []}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              userId={userId}
              onAddDeposit={() => setIsDepositModalOpen(true)}
              onAddExpense={() => setIsExpenseModalOpen(true)}
              onSettleUp={(s) => setSettlingTarget(s)}
            />
          )}

          {activeTab === 'Deposits' && (
            <DepositsTab
              groupId={groupId}
              members={group?.members || []}
              currentUserId={userId}
              onOpenAddDepositModal={() => setIsDepositModalOpen(true)}
            />
          )}

          {activeTab === 'Expenses' && (
            <ExpensesTab
              expenses={expenses}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              userId={userId}
              onAddExpense={() => setIsExpenseModalOpen(true)}
            />
          )}

          {activeTab === 'Settlements' && (
            <SettlementsTab
              settlements={settlements}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              userId={userId}
              onSettle={(s) => setSettlingTarget(s)}
            />
          )}

          {activeTab === 'Members' && (
            <MembersTab
              members={group?.members || []}
              balance={balance}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              userId={userId}
              onInviteMember={() => setIsInviteModalOpen(true)}
            />
          )}
        </View>
      )}

      <AddGroupExpenseModal
        visible={isExpenseModalOpen}
        groupId={groupId}
        members={group?.members || []}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseAdded={handleRefresh}
      />

      <AddGroupDepositModal
        visible={isDepositModalOpen}
        groupId={groupId}
        members={group?.members || []}
        currentUserId={userId}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <InviteMemberModal
        visible={isInviteModalOpen}
        groupId={groupId}
        groupName={group?.name}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ConfirmModal
        visible={settlingTarget !== null}
        title="Confirm Settlement"
        message={
          settlingTarget
            ? `Are you sure you want to mark ৳${settlingTarget.amount.toLocaleString()} as settled with ${
                settlingTarget.to.name || settlingTarget.to.username
              }?`
            : ''
        }
        confirmText="Confirm Settle"
        confirmVariant="primary"
        isLoading={isSettling}
        onConfirm={handleSettleConfirm}
        onClose={() => setSettlingTarget(null)}
      />
    </SafeAreaView>
  );
};
