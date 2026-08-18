import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { groupService, Group } from '../services/groupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';
import { EditGroupModal } from '../components/group/EditGroupModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAuth } from '../store/hooks';

export interface GroupsScreenProps {
  onNavigateBack?: () => void;
  onSelectGroup?: (groupId: string) => void;
}

const TYPE_LOOKUP: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  MESS: { emoji: '🍲', label: 'Mess / Flat', color: '#EA580C', bgColor: '#FFEDD5' },
  FRIENDS: { emoji: '👥', label: 'Friends', color: '#2563EB', bgColor: '#DBEAFE' },
  TOUR: { emoji: '🎒', label: 'Tour', color: '#059669', bgColor: '#D1FAE5' },
  TRIP: { emoji: '✈️', label: 'Trip', color: '#0284C7', bgColor: '#E0F2FE' },
  FAMILY: { emoji: '👨‍👩‍👧', label: 'Family', color: '#7C3AED', bgColor: '#EDE9FE' },
  OFFICE: { emoji: '💼', label: 'Office', color: '#4B5563', bgColor: '#F3F4F6' },
  ROOMMATES: { emoji: '🏠', label: 'Roommates', color: '#D97706', bgColor: '#FEF3C7' },
  STUDENTS: { emoji: '🎓', label: 'Students', color: '#4F46E5', bgColor: '#EEF2FF' },
  OTHER: { emoji: '📁', label: 'Other', color: '#0F766E', bgColor: '#CCFBF1' },
};

export const GroupsScreen: React.FC<GroupsScreenProps> = ({
  onNavigateBack,
  onSelectGroup,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await groupService.getGroups({ limit: 50 });
      const list = res?.groups || res?.data?.groups || res || [];
      setGroups(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load groups');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = async () => {
    await fetchGroups(true);
  };

  const handleGroupCreatedOrUpdated = () => {
    fetchGroups();
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      await groupService.deleteGroup(groupToDelete.id);
      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setGroupToDelete(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        g.type.toLowerCase().includes(q);

      const matchType =
        selectedTypeFilter === 'ALL' || g.type === selectedTypeFilter;

      return matchSearch && matchType;
    });
  }, [groups, searchQuery, selectedTypeFilter]);

  const renderGroupCard = ({ item }: { item: Group }) => {
    const typeMeta = TYPE_LOOKUP[item.type] || TYPE_LOOKUP.OTHER;
    const memberCount = item.members?.length || item._count?.members || 1;
    const isOwner = item.createdById === user?.id;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => onSelectGroup?.(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.typeEmojiCircle, { backgroundColor: typeMeta.bgColor }]}>
              <Text style={styles.typeEmoji}>{typeMeta.emoji}</Text>
            </View>
            <View style={styles.cardTitleInfo}>
              <Text style={styles.groupNameText} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeMeta.bgColor }]}>
                  <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>
                    {typeMeta.label}
                  </Text>
                </View>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.membersCountText}>
                  {memberCount} member{memberCount === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardActionGroup}>
            <TouchableOpacity
              onPress={() => setEditingGroup(item)}
              style={styles.cardIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setGroupToDelete(item)}
              style={[styles.cardIconBtn, styles.deleteIconBtn]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name={isOwner ? 'trash-2' : 'log-out'} size={15} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.groupDescText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.ownerInfo}>
            <Feather name="user" size={12} color={colors.textMuted} />
            <Text style={styles.ownerText}>
              {isOwner ? 'Created by you' : `by @${item.createdBy?.username || 'member'}`}
            </Text>
          </View>

          <View style={styles.enterGroupBtn}>
            <Text style={styles.enterGroupBtnText}>Open Group</Text>
            <Feather name="arrow-right" size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onNavigateBack ? (
              <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Groups</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(true)}
              style={styles.headerAddBtn}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {groups.length > 0 && (
          <>
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search groups by name, type..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Feather name="x" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.filterSection}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['ALL', ...Object.keys(TYPE_LOOKUP)]}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => {
                  const isActive = selectedTypeFilter === item;
                  const label = item === 'ALL' ? 'All Groups' : TYPE_LOOKUP[item]?.label || item;
                  const emoji = item === 'ALL' ? '🌐' : TYPE_LOOKUP[item]?.emoji || '🏷️';
                  return (
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedTypeFilter(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </>
        )}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupCard}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xxl },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="users" size={44} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Groups Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create a group to split mess meals, shared apartment rent, tour budgets, and group bills easily with friends.
                </Text>

                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => setIsCreateModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyCreateBtnText}>Create a Group</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <CreateGroupModal
          visible={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onGroupCreated={handleGroupCreatedOrUpdated}
        />

        <EditGroupModal
          visible={editingGroup !== null}
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onGroupUpdated={handleGroupCreatedOrUpdated}
        />

        <ConfirmModal
          visible={groupToDelete !== null}
          title={groupToDelete?.createdById === user?.id ? 'Delete Group?' : 'Leave Group?'}
          message={
            groupToDelete?.createdById === user?.id
              ? `Are you sure you want to delete "${groupToDelete?.name}"? All group expenses and member records will be permanently deleted.`
              : `Are you sure you want to leave "${groupToDelete?.name}"?`
          }
          confirmText={groupToDelete?.createdById === user?.id ? 'Delete Group' : 'Leave Group'}
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setGroupToDelete(null)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterEmoji: {
    fontSize: 13,
  },
  filterChipText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorBannerText: {
    fontSize: typography.xs,
    color: colors.danger,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm + 2,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  typeEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: {
    fontSize: 22,
  },
  cardTitleInfo: {
    flex: 1,
  },
  groupNameText: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  membersCountText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  cardActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    backgroundColor: colors.dangerLight,
  },
  groupDescText: {
    fontSize: typography.xs + 1,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  enterGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enterGroupBtnText: {
    fontSize: typography.xs + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl + spacing.lg,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sm + 1,
    fontWeight: '800',
  },
});
