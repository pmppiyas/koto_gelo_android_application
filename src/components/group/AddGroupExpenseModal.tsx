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
import { EXPENSE_CATEGORIES } from '../../constants/expense';
import { groupService, GroupMember } from '../../services/groupService';
import {
  getLocalDateString,
  formatExpenseDateForServer,
} from '../../utils/date';

interface AddGroupExpenseModalProps {
  visible: boolean;
  groupId: string;
  members: GroupMember[];
  currentUserId?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onExpenseAdded?: () => void;
}

export const AddGroupExpenseModal: React.FC<AddGroupExpenseModalProps> = ({
  visible,
  groupId,
  members,
  currentUserId,
  onClose,
  onSuccess,
  onExpenseAdded,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (visible && members && members.length > 0) {
      setSelectedParticipantIds(members.map((m) => m.user?.id || m.userId));
    }
  }, [visible, members]);

  const reset = () => {
    setTitle('');
    setAmount('');
    setSelectedCategory('');
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!selectedCategory) return;
    if (selectedParticipantIds.length === 0) return;

    setIsSaving(true);
    try {
      await groupService.addGroupExpense({
        groupId,
        title: title.trim() || undefined,
        amount: parsedAmount,
        category: selectedCategory,
        note: note.trim() || undefined,
        expenseDate: formatExpenseDateForServer(getLocalDateString()),
        splitType: 'EQUAL',
        participants: selectedParticipantIds.map((id) => ({
          userId: id,
          shareAmount: Math.round(parsedAmount / selectedParticipantIds.length),
        })),
      });
      onSuccess?.();
      onExpenseAdded?.();
      handleClose();
    } catch {
      setIsSaving(false);
    }
  };

  const isValid =
    parseFloat(amount) > 0 && selectedCategory && selectedParticipantIds.length > 0;
  const numAmount = parseFloat(amount) || 0;
  const participantCount = selectedParticipantIds.length || 1;
  const splitAmount = numAmount > 0 ? Math.round(numAmount / participantCount) : 0;

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
          <View className="bg-card rounded-t-3xl p-5 max-h-[88%] border-t border-border shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
                  <Feather name="plus-circle" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    Add Group Expense
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Deducted from group fund & shared by members
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="p-1"
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="my-3">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 mt-1">
                AMOUNT (৳) *
              </Text>
              <View className="flex-row items-center bg-background border-2 border-border rounded-2xl px-4 h-14 mb-2">
                <Text className="text-2xl font-extrabold text-primary mr-2">
                  ৳
                </Text>
                <TextInput
                  className="flex-1 text-2xl font-extrabold text-foreground h-full"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              {numAmount > 0 && selectedParticipantIds.length > 0 && (
                <View className="flex-row items-center justify-between bg-primary-light px-3.5 py-2 rounded-xl border border-blue-200 mb-4">
                  <Text className="text-xs text-primary font-semibold">
                    Split between {participantCount} members:
                  </Text>
                  <Text className="text-xs font-extrabold text-primary">
                    ৳{splitAmount.toLocaleString()}/person
                  </Text>
                </View>
              )}

              {/* Participant Selection */}
              {members && members.length > 0 && (
                <View className="bg-muted/40 p-3 rounded-2xl border border-border mb-4 gap-2">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1.5">
                      <Feather name="users" size={13} color="#4F46E5" />
                      <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Split with ({selectedParticipantIds.length}/{members.length})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const allIds = members.map((m) => m.user?.id || m.userId);
                        if (selectedParticipantIds.length === allIds.length) {
                          setSelectedParticipantIds(
                            currentUserId ? [currentUserId] : [],
                          );
                        } else {
                          setSelectedParticipantIds(allIds);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-[11px] font-bold text-primary">
                        {selectedParticipantIds.length === members.length
                          ? 'Deselect Others'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5 pt-0.5">
                    {members.map((m) => {
                      const mId = m.user?.id || m.userId;
                      const isSelected = selectedParticipantIds.includes(mId);
                      const isYou = mId === currentUserId;
                      const name = isYou
                        ? 'You'
                        : m.user?.name || m.user?.username || 'Member';

                      return (
                        <TouchableOpacity
                          key={mId}
                          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                            isSelected
                              ? 'bg-primary-light border-primary'
                              : 'bg-card border-border opacity-60'
                          }`}
                          onPress={() => {
                            if (isSelected) {
                              if (selectedParticipantIds.length > 1) {
                                setSelectedParticipantIds(
                                  selectedParticipantIds.filter((id) => id !== mId),
                                );
                              }
                            } else {
                              setSelectedParticipantIds([
                                ...selectedParticipantIds,
                                mId,
                              ]);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Feather
                            name={isSelected ? 'check-circle' : 'circle'}
                            size={12}
                            color={isSelected ? '#4F46E5' : '#94A3B8'}
                          />
                          <Text
                            className={`text-xs font-semibold ${
                              isSelected
                                ? 'text-primary font-bold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                EXPENSE TITLE / ITEM
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-4"
                placeholder="e.g. Bazar, Lunch, Grocery, Electricity Bill"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />

              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                CATEGORY *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 py-1 mb-4"
              >
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-primary-light border-primary'
                          : 'bg-background border-border'
                      }`}
                      onPress={() => setSelectedCategory(cat.name)}
                      activeOpacity={0.7}
                    >
                      <Text className="text-base">{cat.emoji}</Text>
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground font-medium'
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                NOTE (OPTIONAL)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-2"
                placeholder="Additional details..."
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </ScrollView>

            <View className="flex-row items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-3"
                onPress={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-xl py-3"
                onPress={handleSave}
                disabled={!isValid || isSaving}
                isLoading={isSaving}
              >
                Add Expense
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
