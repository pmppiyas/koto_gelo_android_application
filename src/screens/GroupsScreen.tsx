import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from '../components/ui/core';
import { groupService, Group } from '../services/groupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';
import { EditGroupModal } from '../components/group/EditGroupModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAuth } from '../store/hooks';

export interface GroupsScreenProps {
  onNavigateBack?: () => void;
  onSelectGroup?: (groupId: string) => void;
}

const TYPE_LOOKUP: Record<
  string,
  { emoji: string; label: string; color: string; bgColor: string }
> = {
  MESS: {
    emoji: '🍲',
    label: 'Mess / Flat',
    color: '#4F46E5',
    bgColor: 'bg-indigo-50',
  },
  FRIENDS: {
    emoji: '👥',
    label: 'Friends',
    color: '#2563EB',
    bgColor: 'bg-blue-50',
  },
  TOUR: {
    emoji: '🎒',
    label: 'Tour',
    color: '#059669',
    bgColor: 'bg-emerald-50',
  },
  TRIP: { emoji: '✈️', label: 'Trip', color: '#0284C7', bgColor: 'bg-sky-50' },
  FAMILY: {
    emoji: '👨‍👩‍👧',
    label: 'Family',
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
  },
  OFFICE: {
    emoji: '💼',
    label: 'Office',
    color: '#4B5563',
    bgColor: 'bg-slate-100',
  },
  ROOMMATES: {
    emoji: '🏠',
    label: 'Roommates',
    color: '#0D9488',
    bgColor: 'bg-teal-50',
  },
  STUDENTS: {
    emoji: '🎓',
    label: 'Students',
    color: '#4F46E5',
    bgColor: 'bg-indigo-50',
  },
  OTHER: {
    emoji: '📁',
    label: 'Other',
    color: '#0F766E',
    bgColor: 'bg-teal-50',
  },
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

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
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
          <Text className="text-lg font-bold text-foreground">My Groups</Text>
          <Text className="text-xs text-muted-foreground">
            {groups.length} group{groups.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-primary-light border border-indigo-200 items-center justify-center"
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-1.5 gap-2"
        contentContainerStyle={{ paddingBottom: 2 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
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
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-1"
            >
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Unified Table Card matching standard app tables */}
        <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-2">
          {/* Table Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <Text
                className="text-base font-bold text-foreground"
                numberOfLines={1}
              >
                {searchQuery ? 'Search Results' : 'All Groups'}
              </Text>
              <View className="bg-primary-light px-2 py-0.5 rounded-full border border-indigo-200">
                <Text className="text-[10px] font-bold text-primary">
                  {filteredGroups.length}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(true)}
              className="flex-row items-center gap-1 bg-primary-light px-2.5 py-1 rounded-full border border-indigo-200"
              activeOpacity={0.7}
            >
              <Feather name="plus" size={12} color="#4F46E5" />
              <Text className="text-xs font-bold text-primary">New Group</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-12 gap-2">
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text className="text-xs text-muted-foreground">
                Loading groups...
              </Text>
            </View>
          ) : filteredGroups.length === 0 ? (
            <View className="py-8 items-center justify-center">
              <View className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center mb-2 shadow-xs">
                <Feather name="users" size={20} color="#4F46E5" />
              </View>
              <Text className="text-sm font-bold text-foreground text-center">
                {searchQuery ? 'No Matching Groups' : 'No Groups Yet'}
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-0.5 mb-3 max-w-[240px]">
                {searchQuery
                  ? 'Try searching with a different name or keyword.'
                  : 'Create a shared group for your flat, roommates or tour.'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(true)}
                className="flex-row items-center gap-1.5 bg-primary px-3.5 py-1.5 rounded-full shadow-xs"
                activeOpacity={0.8}
              >
                <Feather name="plus" size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {filteredGroups.map((item, index) => {
                const typeInfo = TYPE_LOOKUP[item.type] || TYPE_LOOKUP.OTHER;
                const memberCount =
                  item.members?.length || item._count?.members || 1;
                const isOwner = item.createdById === user?.id;

                return (
                  <TouchableOpacity
                    key={`${item.id}_${index}`}
                    className={`flex-row items-center justify-between py-2.5 px-2 rounded-xl transition-all`}
                    onPress={() => onSelectGroup?.(item.id)}
                    activeOpacity={0.7}
                  >
                    {/* Left: Type Avatar & Info */}
                    <View className="flex-row items-center flex-1 pr-3">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${typeInfo.bgColor}`}
                      >
                        <Text className="text-lg">{typeInfo.emoji}</Text>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text
                            className="text-sm font-bold text-foreground"
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          {isOwner && (
                            <View className="bg-primary-light px-1.5 py-0.2 rounded-md border border-indigo-200">
                              <Text className="text-[5px] font-bold text-primary">
                                Admin
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          className="text-xs text-muted-foreground mt-0.5"
                          numberOfLines={1}
                        >
                          {typeInfo.label} • {memberCount}{' '}
                          {memberCount === 1 ? 'member' : 'members'}
                        </Text>

                        {item.description ? (
                          <Text
                            className="text-[11px] text-muted-foreground/80 mt-0.5"
                            numberOfLines={1}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Right: Actions + Chevron */}
                    <View className="flex-row items-center gap-1.5">
                      {isOwner && (
                        <>
                          <TouchableOpacity
                            className="w-7 h-7 rounded-full bg-muted/80 items-center justify-center"
                            onPress={e => {
                              e.stopPropagation();
                              setEditingGroup(item);
                            }}
                            activeOpacity={0.7}
                          >
                            <Feather name="edit-2" size={12} color="#64748B" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 items-center justify-center"
                            onPress={e => {
                              e.stopPropagation();
                              setGroupToDelete(item);
                            }}
                            activeOpacity={0.7}
                          >
                            <Feather name="trash-2" size={12} color="#EF4444" />
                          </TouchableOpacity>
                        </>
                      )}
                      <Feather name="chevron-right" size={16} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
