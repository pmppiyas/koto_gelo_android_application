import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView } from '../../ui/core';
import { GroupDeposit, groupService, GroupMember } from '../../../services/groupService';
import { localGroupService } from '../../../services/localGroupService';
import { GroupDepositCard } from '../GroupDepositCard';
import { ConfirmModal } from '../../common/ConfirmModal';
import { BOTTOM_TAB_HEIGHT, spacing } from '../../../constants/spacing';

export interface DepositsTabProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  onOpenAddDepositModal: () => void;
}

export const DepositsTab: React.FC<DepositsTabProps> = ({
  groupId,
  members,
  currentUserId,
  onOpenAddDepositModal,
}) => {
  const [deposits, setDeposits] = useState<GroupDeposit[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Instant 0ms offline load
  useEffect(() => {
    if (groupId) {
      localGroupService.getStoredGroupDeposits(groupId).then((stored) => {
        if (stored && stored.length > 0) {
          setDeposits(stored as any);
          setIsLoading(false);
        }
      }).catch(() => {});
    }
  }, [groupId]);

  const fetchDeposits = useCallback(
    async (isRefresh = false) => {
      if (!groupId) return;
      if (isRefresh) {
        setIsRefreshing(true);
      }

      try {
        const [depRes, sumRes] = await Promise.allSettled([
          groupService.getGroupDeposits(groupId, { limit: 100 }),
          groupService.getGroupDepositSummary(groupId),
        ]);

        if (depRes.status === 'fulfilled') {
          const list =
            depRes.value?.deposits ||
            depRes.value?.data?.deposits ||
            (Array.isArray(depRes.value) ? depRes.value : []);
          setDeposits(list);
        }

        if (sumRes.status === 'fulfilled') {
          setSummaryData(sumRes.value?.data || sumRes.value);
        }
      } catch {} finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleDeleteDeposit = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await groupService.deleteGroupDeposit(deleteTargetId);
      setDeleteTargetId(null);
      fetchDeposits(true);
    } catch {} finally {
      setIsDeleting(false);
    }
  };

  const totalFund = summaryData?.totalGroupDeposit ?? deposits.reduce((sum, d) => sum + Number(d.amount), 0);

  // Robust member deposit calculation fallback
  const memberSummaries = useMemo(() => {
    if (summaryData?.memberSummaries && summaryData.memberSummaries.length > 0) {
      return summaryData.memberSummaries;
    }
    const map = new Map<string, { user: any; totalDeposited: number }>();
    (members || []).forEach(m => {
      const u = m.user || (m as any);
      const uId = u?.id || m.userId;
      if (uId) {
        map.set(uId, { user: u, totalDeposited: 0 });
      }
    });
    deposits.forEach(d => {
      const uId = d.userId || (d.user as any)?.id;
      if (uId) {
        if (!map.has(uId)) {
          map.set(uId, { user: d.user, totalDeposited: 0 });
        }
        map.get(uId)!.totalDeposited += Number(d.amount) || 0;
      }
    });
    return Array.from(map.values()).filter(m => m.totalDeposited > 0);
  }, [summaryData, members, deposits]);

  return (
    <View className="flex-1">
      <FlatList
        data={deposits}
        keyExtractor={(item, index) => item.id || item.serverId || item.localId || `dep_${index}`}
        renderItem={({ item }) => (
          <GroupDepositCard
            deposit={item}
            currentUserId={currentUserId}
            members={members}
            onDelete={(id) => setDeleteTargetId(id)}
          />
        )}
        contentContainerClassName="px-4 pt-3"
        contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchDeposits(true)}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListHeaderComponent={
          <>
            <View className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-3">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-semibold text-muted-foreground mb-0.5">
                    Total Funds Collected
                  </Text>
                  <Text className="text-2xl font-extrabold text-emerald-600">
                    ৳{totalFund.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 bg-emerald-600 py-2 px-3.5 rounded-full shadow-sm"
                  onPress={onOpenAddDepositModal}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={15} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Add Deposit</Text>
                </TouchableOpacity>
              </View>

              {memberSummaries.length > 0 && (
                <View className="mt-3.5 pt-3 border-t border-border">
                  <Text className="text-[10px] font-bold text-muted-foreground tracking-wider mb-2">
                    MEMBER DEPOSITS BREAKDOWN
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-0.5"
                  >
                    {memberSummaries.map((m: any, idx: number) => {
                      const name = m.user?.name || (m.user?.username ? `@${m.user.username}` : 'Member');
                      return (
                        <View key={idx} className="bg-background border border-border py-1.5 px-3 rounded-xl">
                          <Text className="text-[10px] font-semibold text-muted-foreground" numberOfLines={1}>
                            {name}
                          </Text>
                          <Text className="text-xs font-extrabold text-emerald-600">
                            +৳{Number(m.totalDeposited).toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="mb-2">
              <Text className="text-[10px] font-bold text-muted-foreground tracking-wider">
                DEPOSIT HISTORY ({deposits.length})
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-16 gap-3">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-xs text-muted-foreground">Loading group deposits...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-16 px-4">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-3">
                <Feather name="download" size={30} color="#16A34A" />
              </View>
              <Text className="text-base font-bold text-foreground mb-1">No Deposits Recorded Yet</Text>
              <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
                Add money given by members to build the group fund before or after shopping.
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 bg-emerald-600 px-5 py-3 rounded-full shadow-sm"
                onPress={onOpenAddDepositModal}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Record First Deposit</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete Deposit Record"
        message="Are you sure you want to cancel and remove this deposit from the group? This cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteDeposit}
        onClose={() => setDeleteTargetId(null)}
      />
    </View>
  );
};
