import React, { useState, useMemo } from 'react';
import {
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from '../../../components/ui/core';
import { InvitationCard } from '../components/InvitationCard';
import { useInvitations } from '../hooks/useInvitations';

export interface InvitationsScreenProps {
  onNavigateBack?: () => void;
}

type FilterType = 'ALL' | 'PENDING';

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({
  onNavigateBack,
}) => {
  const {
    invitations,
    loading,
    actionLoadingId,
    error,
    refresh,
    acceptInvitation,
    rejectInvitation,
  } = useInvitations();

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const pendingCount = useMemo(
    () => invitations.filter(inv => inv.status === 'PENDING').length,
    [invitations],
  );

  const filteredInvitations = useMemo(() => {
    if (activeFilter === 'PENDING') {
      return invitations.filter(inv => inv.status === 'PENDING');
    }
    return invitations;
  }, [invitations, activeFilter]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
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
              Group Invitations
            </Text>
            <Text className="text-xs text-muted-foreground">
              {pendingCount} pending invitation{pendingCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {pendingCount > 0 && (
          <View className="bg-primary-light px-2.5 py-1 rounded-full border border-indigo-200">
            <Text className="text-xs font-bold text-primary">
              {pendingCount} New
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-2 gap-2"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Filter Pills */}
        <View className="flex-row gap-2 mb-1">
          <TouchableOpacity
            className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${
              activeFilter === 'ALL'
                ? 'bg-primary shadow-2xs'
                : 'bg-card border border-border'
            }`}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-bold ${
                activeFilter === 'ALL'
                  ? 'text-white'
                  : 'text-muted-foreground'
              }`}
            >
              All ({invitations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${
              activeFilter === 'PENDING'
                ? 'bg-primary shadow-2xs'
                : 'bg-card border border-border'
            }`}
            onPress={() => setActiveFilter('PENDING')}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-bold ${
                activeFilter === 'PENDING'
                  ? 'text-white'
                  : 'text-muted-foreground'
              }`}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && invitations.length === 0 ? (
          <View className="py-20 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-muted-foreground">
              Loading invitations...
            </Text>
          </View>
        ) : filteredInvitations.length === 0 ? (
          <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border mt-2">
            <View className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center mb-3 shadow-xs">
              <Feather name="mail" size={24} color="#4F46E5" />
            </View>
            <Text className="text-base font-bold text-foreground text-center mb-1">
              {activeFilter === 'PENDING'
                ? 'No Pending Invitations'
                : 'No Invitations Found'}
            </Text>
            <Text className="text-xs text-muted-foreground text-center max-w-[260px] leading-relaxed">
              When someone invites you to a group using your username, you will be able to see and accept it here.
            </Text>
          </View>
        ) : (
          filteredInvitations.map(item => (
            <InvitationCard
              key={item.id}
              invitation={item}
              isLoading={actionLoadingId === item.id}
              onAccept={() => acceptInvitation(item.id)}
              onReject={() => rejectInvitation(item.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


