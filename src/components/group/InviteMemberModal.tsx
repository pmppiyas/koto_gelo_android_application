import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Button,
} from '../ui';
import { groupService } from '../../services/groupService';

export interface InviteMemberModalProps {
  visible: boolean;
  groupId: string;
  groupName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  groupId,
  groupName,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setUsername('');
    setError('');
    setSuccessMessage('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInvite = async () => {
    const trimmedUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await groupService.inviteMember(groupId, { username: trimmedUsername });
      setSuccessMessage(`Invitation sent to @${trimmedUsername}!`);
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-card rounded-t-3xl border-t border-border max-h-[85%] overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <View className="flex-row items-center gap-2.5">
              <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center border border-blue-200">
                <Feather name="user-plus" size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-base font-bold text-foreground">Invite Member</Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {groupName ? `Invite to ${groupName}` : 'Add people to your group'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-muted items-center justify-center"
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" keyboardShouldPersistTaps="handled">
            {/* Success message banner */}
            {successMessage ? (
              <View className="flex-row items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4">
                <Feather name="check-circle" size={18} color="#16A34A" />
                <Text className="text-xs font-semibold text-emerald-700 flex-1">
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {/* Error message banner */}
            {error ? (
              <View className="flex-row items-center gap-2 bg-destructive-light border border-red-200 rounded-xl p-3.5 mb-4">
                <Feather name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-xs font-semibold text-destructive flex-1">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Username <Text className="text-destructive">*</Text>
              </Text>
              <View className="flex-row items-center bg-input-background border border-border rounded-xl px-3.5 py-2.5 focus:border-primary">
                <Text className="text-base font-bold text-muted-foreground mr-1">@</Text>
                <TextInput
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (error) setError('');
                  }}
                  placeholder="Enter username (e.g. johndoe)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-sm text-foreground p-0"
                  editable={!isSubmitting}
                />
                {username ? (
                  <TouchableOpacity
                    onPress={() => setUsername('')}
                    activeOpacity={0.7}
                  >
                    <Feather name="x-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text className="text-xs text-muted-foreground mt-1.5">
                The user will receive an invitation to join this group.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 pt-3 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onPress={handleInvite}
                disabled={isSubmitting || !username.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  'Send Invite'
                )}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
