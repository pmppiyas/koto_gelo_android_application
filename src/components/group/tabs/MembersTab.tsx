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
import { GroupMember, GroupBalance } from '../../../services/groupService';
import { GroupMemberRow } from '../GroupMemberRow';
import { colors } from '../../../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../../../constants/spacing';

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Feather name="users" size={16} color={colors.primary} />
        <Text style={styles.headerText}>Group Members</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>{members.length} Total</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: GroupMember }) => {
    const memberBalance = balance?.balances?.find((b) => b.userId === item.userId);

    return (
      <View style={styles.memberCard}>
        <GroupMemberRow
          name={item.user.name || item.user.username}
          username={item.user.username}
          role={item.role}
          isYou={item.userId === userId}
          netBalance={memberBalance?.net}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
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
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No members found</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerText: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  countBadgeText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
});
