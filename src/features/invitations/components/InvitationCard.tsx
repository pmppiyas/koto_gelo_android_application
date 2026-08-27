import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../../../components/ui/core';
import { Invitation } from '../types/invitation.types';
import { InvitationStatus } from './InvitationStatus';

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

export interface InvitationCardProps {
  invitation: Invitation;
  isLoading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onPress?: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  isLoading = false,
  onAccept,
  onReject,
  onPress,
}) => {
  const emoji = TYPE_EMOJI[invitation.groupType || 'OTHER'] || '📁';
  const isPending = invitation.status === 'PENDING';
  const isAccepted = invitation.status === 'ACCEPTED';
  const isRejected = invitation.status === 'REJECTED';

  const dateFormatted = invitation.createdAt
    ? new Date(invitation.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-3">
      {/* Top Header: Group Icon + Name + Status */}
      <View className="flex-row items-start justify-between gap-2 mb-2.5">
        <View className="flex-row items-center gap-2.5 flex-1 pr-1">
          <View className="w-10 h-10 rounded-xl bg-primary-light border border-indigo-100 items-center justify-center shadow-2xs">
            <Text className="text-xl">{emoji}</Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-foreground"
              numberOfLines={1}
            >
              {invitation.groupName}
            </Text>
            <Text
              className="text-xs text-muted-foreground mt-0.5"
              numberOfLines={1}
            >
              {invitation.groupType || 'Group'} • {dateFormatted}
            </Text>
          </View>
        </View>

        <InvitationStatus status={invitation.status} />
      </View>

      {/* Inviter Info */}
      <View className="flex-row items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl mb-3">
        <Feather name="user-check" size={14} color="#4F46E5" />
        <Text className="text-xs text-foreground flex-1">
          Invited by{' '}
          <Text className="font-bold text-foreground">
            {invitation.inviterUsername
              ? `@${invitation.inviterUsername}`
              : invitation.inviterName}
          </Text>
        </Text>
      </View>

      {/* Action Buttons if Pending */}
      {isPending && (onAccept || onReject) ? (
        <View className="flex-row items-center gap-2.5 pt-1">
          {onReject ? (
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted border border-border"
              onPress={onReject}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Feather name="x" size={14} color="#64748B" />
              <Text className="text-xs font-bold text-slate-700">Decline</Text>
            </TouchableOpacity>
          ) : null}

          {onAccept ? (
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary shadow-xs"
              onPress={onAccept}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">
                    Accept & Join
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : isAccepted ? (
        <View className="flex-row items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <Feather name="check-circle" size={14} color="#16A34A" />
          <Text className="text-xs font-semibold text-emerald-700">
            You joined this group
          </Text>
        </View>
      ) : isRejected ? (
        <View className="flex-row items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
          <Feather name="x-circle" size={14} color="#DC2626" />
          <Text className="text-xs font-semibold text-rose-700">
            You declined this invitation
          </Text>
        </View>
      ) : null}
    </View>
  );
};
