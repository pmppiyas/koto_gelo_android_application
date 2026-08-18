import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Settlement } from '../../../services/groupService';
import { SettlementCard } from '../SettlementCard';
import { colors } from '../../../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../../../constants/spacing';

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={settlements}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      ListHeaderComponent={
        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            These are the minimum transfers calculated to balance all member dues.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <SettlementCard
          fromName={item.from.name || item.from.username}
          toName={item.to.name || item.to.username}
          amount={item.amount}
          isYouFrom={item.from.id === userId}
          isYouTo={item.to.id === userId}
          onSettle={() => onSettle(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="check-circle" size={40} color={colors.secondary} />
          </View>
          <Text style={styles.emptyTitle}>All Settled Up!</Text>
          <Text style={styles.emptySubtitle}>
            No pending debts or settlements needed in this group right now.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md - 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.xs + 1,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
