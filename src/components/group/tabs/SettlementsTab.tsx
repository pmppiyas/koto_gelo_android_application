import React from 'react';
import {
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../../ui/core';
import { SettlementCard } from '../SettlementCard';
import { Settlement } from '../../../services/groupService';
import { BOTTOM_TAB_HEIGHT, spacing } from '../../../constants/spacing';

export interface SettlementsTabProps {
  settlements: Settlement[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  userId: string;
  onSettle: (settlement: Settlement) => void;
}

export const SettlementsTab: React.FC<SettlementsTabProps> = ({
  settlements,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
  onSettle,
}) => {
  if (isLoading && settlements.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <FlatList
      data={settlements}
      keyExtractor={(item, index) => `${item.from.id}-${item.to.id}-${index}`}
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
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      ListHeaderComponent={
        settlements.length > 0 ? (
          <View className="flex-row items-center gap-2 bg-primary-light p-3 rounded-xl border border-blue-200 mb-3">
            <Feather name="info" size={16} color="#2563EB" />
            <Text className="text-xs text-primary font-medium flex-1 leading-snug">
              These are the minimum transactions needed to settle all debts and month-end balances in the group.
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <SettlementCard
          settlement={item}
          currentUserId={userId}
          onSettle={() => onSettle(item)}
        />
      )}
      ListEmptyComponent={
        <View className="bg-card rounded-2xl p-6 items-center justify-center border border-dashed border-border mt-4">
          <Feather name="check-circle" size={32} color="#10B981" style={{ marginBottom: 8 }} />
          <Text className="text-base font-bold text-foreground mb-1">No Pending Settlements 🎉</Text>
          <Text className="text-xs text-muted-foreground text-center leading-relaxed">
            Everyone is fully squared away! When new expenses or deposits are added, optimal settlement transfers will appear here.
          </Text>
        </View>
      }
    />
  );
};
