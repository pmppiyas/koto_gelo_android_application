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
  onClose,
  onSuccess,
  onExpenseAdded,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      });
      onSuccess?.();
      onExpenseAdded?.();
      handleClose();
    } catch {
      setIsSaving(false);
    }
  };

  const isValid = parseFloat(amount) > 0 && selectedCategory;
  const numAmount = parseFloat(amount) || 0;
  const memberCount = members.length || 1;
  const splitAmount = numAmount > 0 ? Math.round(numAmount / memberCount) : 0;

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
                    Split equally with all members
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

              {numAmount > 0 && (
                <View className="flex-row items-center justify-between bg-primary-light px-3.5 py-2 rounded-xl border border-blue-200 mb-4">
                  <Text className="text-xs text-primary font-semibold">
                    Equal Split ({memberCount} members):
                  </Text>
                  <Text className="text-xs font-extrabold text-primary">
                    ৳{splitAmount.toLocaleString()}/person
                  </Text>
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
                {EXPENSE_CATEGORIES.map(cat => {
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
