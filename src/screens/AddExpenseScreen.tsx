import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Button } from '../components/ui';
import { EXPENSE_CATEGORIES, CategoryInfo } from '../constants/expense';
import { useExpenses, useAuth } from '../store/hooks';
import { getLocalDateString, formatExpenseDateForServer } from '../utils/date';
import { groupService, Group } from '../services/groupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface AddExpenseScreenProps {
  onClose: () => void;
}

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

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ onClose }) => {
  const { addExpense } = useExpenses();
  const { isAuthenticated } = useAuth();

  const [expenseType, setExpenseType] = useState<'PERSONAL' | 'GROUP'>('PERSONAL');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGroups(true);
    try {
      const response = await groupService.getGroups({ limit: 50 });
      const groupList = response?.groups || response?.data?.groups || (Array.isArray(response) ? response : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      if (groupList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupList[0].id);
      }
    } catch {} finally {
      setIsLoadingGroups(false);
    }
  }, [isAuthenticated, selectedGroupId]);

  useEffect(() => {
    if (expenseType === 'GROUP') {
      fetchGroups();
    }
  }, [expenseType, fetchGroups]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery) return EXPENSE_CATEGORIES;
    const q = categorySearchQuery.toLowerCase();
    return EXPENSE_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subcategories.some((s) => s.toLowerCase().includes(q))
    );
  }, [categorySearchQuery]);

  const handleSubmit = async () => {
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category.');
      return;
    }

    if (expenseType === 'GROUP' && !selectedGroupId) {
      setError('Please select a group to add this expense to.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (expenseType === 'PERSONAL') {
        await addExpense({
          amount: parsedAmount,
          category: selectedCategory.name,
          subcategory: selectedSubcategory || undefined,
          title: title.trim() || undefined,
          note: note.trim() || undefined,
          date: formatExpenseDateForServer(date),
          type: 'PERSONAL',
        });
      } else {
        await addExpense({
          amount: parsedAmount,
          category: selectedCategory.name,
          subcategory: selectedSubcategory || undefined,
          title: title.trim() || undefined,
          note: note.trim() || undefined,
          date: formatExpenseDateForServer(date),
          type: 'GROUP',
          groupId: selectedGroupId,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );
  const memberCount = selectedGroup?.members?.length || 1;
  const numAmount = parseFloat(amount) || 0;
  const splitAmount = numAmount > 0 ? Math.round(numAmount / memberCount) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
          <View className="flex-row items-center gap-2">
            <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center">
              <Feather name="plus-circle" size={20} color="#4F46E5" />
            </View>
            <Text className="text-lg font-bold text-foreground">Add New Expense</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-1.5" activeOpacity={0.7}>
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row bg-muted p-1 rounded-xl">
            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                expenseType === 'PERSONAL' ? 'bg-card shadow-sm' : ''
              }`}
              onPress={() => setExpenseType('PERSONAL')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  expenseType === 'PERSONAL' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Personal Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                expenseType === 'GROUP' ? 'bg-card shadow-sm' : ''
              }`}
              onPress={() => setExpenseType('GROUP')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  expenseType === 'GROUP' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Group / Mess Split
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl border border-rose-200">
              <Feather name="alert-circle" size={15} color="#EF4444" />
              <Text className="text-xs text-destructive font-medium flex-1">{error}</Text>
            </View>
          ) : null}

          {expenseType === 'GROUP' && (
            <View className="gap-1.5">
              <View className="flex-row justify-between items-center px-1">
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  SELECT GROUP
                </Text>
                <TouchableOpacity
                  onPress={() => setIsCreateGroupModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-bold text-primary">+ Create Group</Text>
                </TouchableOpacity>
              </View>

              {isLoadingGroups ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 py-1"
                >
                  {groups.map((grp) => {
                    const isSelected = selectedGroupId === grp.id;
                    const emoji = TYPE_EMOJI[grp.type] || '👥';
                    return (
                      <TouchableOpacity
                        key={grp.id}
                        className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? 'bg-primary-light border-primary'
                            : 'bg-card border-border'
                        }`}
                        onPress={() => setSelectedGroupId(grp.id)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm">{emoji}</Text>
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {grp.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          <View className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              AMOUNT (৳) *
            </Text>
            <View className="flex-row items-center bg-background border-2 border-border rounded-xl px-4 h-14">
              <Text className="text-2xl font-extrabold text-primary mr-2">৳</Text>
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

            {expenseType === 'GROUP' && numAmount > 0 && selectedGroup && (
              <View className="flex-row items-center justify-between bg-primary-light px-3 py-2 rounded-xl border border-blue-200 mt-2.5">
                <Text className="text-xs text-primary font-semibold">
                  Split between {memberCount} members:
                </Text>
                <Text className="text-xs font-extrabold text-primary">
                  ৳{splitAmount.toLocaleString()}/person
                </Text>
              </View>
            )}
          </View>

          <View className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                CATEGORY *
              </Text>
              {selectedCategory && (
                <Text className="text-xs font-bold text-primary">
                  Selected: {selectedCategory.name}
                </Text>
              )}
            </View>

            <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
              <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                className="flex-1 text-xs text-foreground"
                placeholder="Search category (e.g. food, rent, wifi)..."
                placeholderTextColor="#94A3B8"
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 py-1"
            >
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                      isSelected
                        ? 'bg-primary-light border-primary'
                        : 'bg-background border-border'
                    }`}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setSelectedSubcategory('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base">{cat.emoji}</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-primary font-bold' : 'text-foreground'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <View className="gap-1.5 pt-2 border-t border-border">
                <Text className="text-[11px] font-semibold text-muted-foreground">
                  Subcategory (Optional):
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-1.5 py-0.5"
                >
                  {selectedCategory.subcategories.map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        className={`px-2.5 py-1 rounded-lg border ${
                          isSubSelected
                            ? 'bg-primary-light border-primary'
                            : 'bg-background border-border'
                        }`}
                        onPress={() => setSelectedSubcategory(isSubSelected ? '' : sub)}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`text-[11px] font-medium ${
                            isSubSelected ? 'text-primary font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3">
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                ITEM / TITLE (OPTIONAL)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="e.g. Rice, Egg, Rickshaw Fare, Wifi Bill"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                NOTE / DETAILS (OPTIONAL)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="Additional info..."
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </View>
          </View>

          <Button
            variant="default"
            className="w-full py-4 rounded-2xl shadow-lg mt-2"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            Save Expense
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <CreateGroupModal
        visible={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={fetchGroups}
      />
    </SafeAreaView>
  );
};
