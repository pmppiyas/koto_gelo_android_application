import React, { useState } from 'react';
import { Modal, Platform } from 'react-native';
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
import { groupService, CreateGroupPayload } from '../../services/groupService';

export interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const GROUP_TYPES = [
  {
    id: 'MESS',
    label: 'Mess / Hostel',
    emoji: '🍲',
    desc: 'Meals, rent & utilities',
  },
  {
    id: 'FRIENDS',
    label: 'Friends',
    emoji: '👥',
    desc: 'Hangouts, dining & parties',
  },
  { id: 'TOUR', label: 'Tour', emoji: '🎒', desc: 'Travel & vacation trips' },
  {
    id: 'TRIP',
    label: 'Trip / Outing',
    emoji: '✈️',
    desc: 'Day trips & events',
  },
  {
    id: 'FAMILY',
    label: 'Family',
    emoji: '👨‍👩‍👧',
    desc: 'Household shared expenses',
  },
  {
    id: 'OFFICE',
    label: 'Office',
    emoji: '💼',
    desc: 'Work lunches & team events',
  },
  {
    id: 'ROOMMATES',
    label: 'Roommates',
    emoji: '🏠',
    desc: 'Flat rent, bills & wifi',
  },
  {
    id: 'STUDENTS',
    label: 'Students',
    emoji: '🎓',
    desc: 'Study projects & events',
  },
  { id: 'OTHER', label: 'Other', emoji: '📁', desc: 'General shared expenses' },
] as const;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] =
    useState<CreateGroupPayload['type']>('MESS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedType('MESS');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a group name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await groupService.createGroup({
        name: trimmedName,
        description: description.trim() || undefined,
        type: selectedType,
      });

      resetForm();
      onGroupCreated();
      onClose();
    } catch (err: any) {
      setError(
        err?.message || 'Failed to create group. Please check connection.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-slate-950/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <View className="bg-card rounded-t-3xl p-5 max-h-[85%] border-t border-border shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                  <Feather name="users" size={20} color="#2563EB" />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  Create New Group
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="p-1"
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl mt-3 border border-rose-200">
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text className="text-xs text-destructive font-medium flex-1">
                  {error}
                </Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} className="my-3">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 mt-1">
                GROUP NAME *
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-4"
                placeholder="e.g. Uttara Mess, Cox's Bazar Tour"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                maxLength={60}
              />

              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                GROUP TYPE
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {GROUP_TYPES.map(type => {
                  const isSelected = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-primary-light border-primary'
                          : 'bg-background border-border'
                      }`}
                      onPress={() => setSelectedType(type.id as any)}
                      activeOpacity={0.7}
                    >
                      <Text className="text-base">{type.emoji}</Text>
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground font-medium'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                DESCRIPTION (OPTIONAL)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground h-20"
                placeholder="Brief note about group members, flat rules, or trip plan..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
            </ScrollView>

            <View className="flex-row items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-3"
                onPress={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-xl py-3"
                onPress={handleCreate}
                isLoading={isSubmitting}
              >
                Create Group
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
