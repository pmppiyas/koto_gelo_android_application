import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput } from '../components/ui/core';
import { groupService, Group } from '../services/groupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';
import { EditGroupModal } from '../components/group/EditGroupModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAuth } from '../store/hooks';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface GroupsScreenProps {
  onNavigateBack?: () => void;
  onSelectGroup?: (groupId: string) => void;
}

const TYPE_LOOKUP: Record<
  string,
  { emoji: string; label: string; color: string; bgColor: string }
> = {
  MESS: { emoji: '🍲', label: 'Mess / Flat', color: '#4F46E5', bgColor: 'bg-indigo-50' },
  FRIENDS: { emoji: '👥', label: 'Friends', color: '#2563EB', bgColor: 'bg-blue-50' },
  TOUR: { emoji: '🎒', label: 'Tour', color: '#059669', bgColor: 'bg-emerald-50' },
  TRIP: { emoji: '✈️', label: 'Trip', color: '#0284C7', bgColor: 'bg-sky-50' },
  FAMILY: { emoji: '👨‍👩‍👧', label: 'Family', color: '#7C3AED', bgColor: 'bg-purple-50' },
  OFFICE: { emoji: '💼', label: 'Office', color: '#4B5563', bgColor: 'bg-slate-100' },
  ROOMMATES: { emoji: '🏠', label: 'Roommates', color: '#0D9488', bgColor: 'bg-teal-50' },
  STUDENTS: { emoji: '🎓', label: 'Students', color: '#4F46E5', bgColor: 'bg-indigo-50' },
  OTHER: { emoji: '📁', label: 'Other', color: '#0F766E', bgColor: 'bg-teal-50' },
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGroups = useCallback(
    async (isRefresh = false) => {
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
        const response = await groupService.getGroups({ limit: 50 });
        const groupList =
          response?.groups ||
          response?.data?.groups ||
          (Array.isArray(response) ? response : []);
        setGroups(Array.isArray(groupList) ? groupList : []);
      } catch (err: any) {
        setErrorMessage('You are offline (showing offline/local data)');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = () => {
    fetchGroups(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await groupService.deleteGroup(groupToDelete.id);
      setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
      setGroupToDelete(null);
    } catch {
      setErrorMessage('Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      return (
        searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description &&
          g.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [groups, searchQuery]);

  const renderGroupCard = ({ item }: { item: Group }) => {
    const typeInfo = TYPE_LOOKUP[item.type] || TYPE_LOOKUP.OTHER;
    const memberCount = item.members?.length || item._count?.members || 1;
    const isOwner = item.createdById === user?.id;

    return (
      <TouchableOpacity
        className="bg-card rounded-2xl p-4 border border-border shadow-xs mb-3 active:bg-muted/30"
        onPress={() => onSelectGroup?.(item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-3.5 pr-2">
            {/* Clean Emoji Avatar Box */}
            <View
              className={`w-11 h-11 rounded-2xl items-center justify-center ${typeInfo.bgColor} shadow-2xs`}
            >
              <Text className="text-xl">{typeInfo.emoji}</Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-base font-extrabold text-foreground"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {isOwner && (
                  <View className="bg-primary-light px-2 py-0.5 rounded-full border border-indigo-200">
                    <Text className="text-[10px] font-bold text-primary">
                      Admin
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className="text-xs text-muted-foreground font-medium mt-0.5"
                numberOfLines={1}
              >
                {typeInfo.label} • {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {/* Action buttons (Edit & Delete for Owner) + Chevron */}
          <View className="flex-row items-center gap-1.5">
            {isOwner && (
              <>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-muted/80 items-center justify-center"
                  onPress={e => {
                    e.stopPropagation();
                    setEditingGroup(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="edit-2" size={13} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 items-center justify-center"
                  onPress={e => {
                    e.stopPropagation();
                    setGroupToDelete(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={13} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </View>
        </View>

        {item.description ? (
          <Text
            className="text-xs text-muted-foreground mt-2.5 pt-2.5 border-t border-border/50 leading-relaxed"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border shadow-2xs">
        {onNavigateBack && (
          <TouchableOpacity
            onPress={onNavigateBack}
            className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-2"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            My Groups
          </Text>
          <Text className="text-xs text-muted-foreground">
            {groups.length} group{groups.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2 rounded-full shadow-sm"
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Create</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-4 gap-3">
        {/* Search Bar */}
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3.5 h-11 shadow-2xs">
          <Feather
            name="search"
            size={16}
            color="#94A3B8"
            style={{ marginRight: 8 }}
          />
          <TextInput
            className="flex-1 text-sm text-foreground"
            placeholder="Search groups..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-20 gap-3">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-muted-foreground">
              Loading your groups...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            keyExtractor={item => item.id}
            renderItem={renderGroupCard}
            contentContainerStyle={{
              paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            }
            ListEmptyComponent={
              <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border mt-4">
                <View className="w-14 h-14 rounded-2xl bg-primary-light border border-indigo-100 items-center justify-center mb-3 shadow-xs">
                  <Feather name="users" size={24} color="#4F46E5" />
                </View>
                <Text className="text-base font-extrabold text-foreground mb-1">
                  {searchQuery ? 'No Matching Groups' : 'No Groups Found'}
                </Text>
                <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-4 max-w-[260px]">
                  {searchQuery
                    ? 'Try searching with a different keyword.'
                    : 'Create a mess, roommates, or tour group to start splitting shared bills.'}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-2 bg-primary px-5 py-2.5 rounded-full shadow-xs"
                  onPress={() => setIsCreateModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">
                    Create First Group
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <CreateGroupModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={() => fetchGroups(true)}
      />

      <EditGroupModal
        visible={editingGroup !== null}
        group={editingGroup}
        onClose={() => setEditingGroup(null)}
        onGroupUpdated={() => fetchGroups(true)}
      />

      <ConfirmModal
        visible={groupToDelete !== null}
        title="Delete Group"
        message={
          groupToDelete
            ? `Are you sure you want to permanently delete "${groupToDelete.name}"? All associated expenses and balances will be removed.`
            : ''
        }
        confirmText="Delete Group"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteGroup}
        onClose={() => setGroupToDelete(null)}
      />
    </SafeAreaView>
  );
};
