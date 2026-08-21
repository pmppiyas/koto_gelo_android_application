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
  onClose: (createdType?: 'PERSONAL' | 'GROUP', groupId?: string) => void;
  initialType?: 'PERSONAL' | 'GROUP';
  initialGroupId?: string;
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

const TOP_5_CATEGORY_IDS = [
  'food-dining',
  'transport',
  'bills-utilities',
  'housing',
  'shopping',
];

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onClose,
  initialType = 'PERSONAL',
  initialGroupId,
}) => {
  const { addExpense, expenses } = useExpenses();
  const { user, isAuthenticated } = useAuth();

  const [expenseType, setExpenseType] = useState<'PERSONAL' | 'GROUP'>(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState<boolean>(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || '');
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const amountInputRef = useRef<any>(null);
  const subCategorySectionRef = useRef<any>(null);
  const amountSectionRef = useRef<any>(null);
  const subCategoryLayoutY = useRef<number>(0);
  const amountLayoutY = useRef<number>(0);

  // 1. Analytics-driven Top Categories: Strictly ranks highest used category first (#1, #2, ...)
  const { topCategories, otherCategories, isAnalyticsBased } = useMemo(() => {
    const categoryFrequency: Record<string, number> = {};
    const categorySpend: Record<string, number> = {};

    (expenses || []).forEach((e) => {
      const catName = e.category?.trim();
      if (!catName) return;
      const lower = catName.toLowerCase();
      categoryFrequency[lower] = (categoryFrequency[lower] || 0) + 1;
      categorySpend[lower] = (categorySpend[lower] || 0) + (Number(e.amount) || 0);
    });

    const getScore = (c: CategoryInfo) => {
      const freq =
        (categoryFrequency[c.name.toLowerCase()] || 0) +
        (categoryFrequency[c.id.toLowerCase()] || 0) +
        (categoryFrequency[c.slug.toLowerCase()] || 0);
      const spend =
        (categorySpend[c.name.toLowerCase()] || 0) +
        (categorySpend[c.id.toLowerCase()] || 0) +
        (categorySpend[c.slug.toLowerCase()] || 0);
      return { freq, spend };
    };

    // Sort all categories strictly by frequency descending, then spend descending
    const rankedCategories = [...EXPENSE_CATEGORIES].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreB.freq !== scoreA.freq) return scoreB.freq - scoreA.freq;
      if (scoreB.spend !== scoreA.spend) return scoreB.spend - scoreA.spend;
      return 0;
    });

    const usedCategories = rankedCategories.filter((c) => getScore(c).freq > 0);

    const topList: CategoryInfo[] = [];
    const topIds = new Set<string>();

    // Add user's most used categories first (#1 most used is strictly first)
    usedCategories.slice(0, 5).forEach((c) => {
      topList.push(c);
      topIds.add(c.id);
    });

    // Fill remaining spots up to 5 from default popular categories if needed
    if (topList.length < 5) {
      TOP_5_CATEGORY_IDS.forEach((id) => {
        if (topList.length < 5 && !topIds.has(id)) {
          const found = EXPENSE_CATEGORIES.find((c) => c.id === id);
          if (found) {
            topList.push(found);
            topIds.add(found.id);
          }
        }
      });
    }

    // Remaining categories sorted by frequency as well
    let others = rankedCategories.filter((c) => !topIds.has(c.id));
    if (categorySearchQuery) {
      const q = categorySearchQuery.toLowerCase();
      others = EXPENSE_CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subcategories.some((s) => s.toLowerCase().includes(q))
      );
    }

    return {
      topCategories: topList,
      otherCategories: others,
      isAnalyticsBased: usedCategories.length > 0,
    };
  }, [expenses, categorySearchQuery]);

  // 2. Analytics-driven Subcategories for the selected category
  const analyzedSubcategories = useMemo(() => {
    if (!selectedCategory || !selectedCategory.subcategories?.length) {
      return { topSubcategories: [], regularSubcategories: [], hasAnalytics: false };
    }

    const subFreq: Record<string, number> = {};
    (expenses || []).forEach((e) => {
      const catMatch =
        e.category?.toLowerCase() === selectedCategory.name.toLowerCase() ||
        e.category?.toLowerCase() === selectedCategory.slug.toLowerCase() ||
        e.category?.toLowerCase() === selectedCategory.id.toLowerCase();

      if (catMatch && e.subcategory) {
        const sub = e.subcategory.trim().toLowerCase();
        subFreq[sub] = (subFreq[sub] || 0) + 1;
      }
    });

    const sorted = [...selectedCategory.subcategories].sort((a, b) => {
      const countA = subFreq[a.toLowerCase()] || 0;
      const countB = subFreq[b.toLowerCase()] || 0;
      return countB - countA;
    });

    const topSubs = sorted.filter((s) => (subFreq[s.toLowerCase()] || 0) > 0);
    const regularSubs = sorted.filter((s) => (subFreq[s.toLowerCase()] || 0) === 0);

    return {
      topSubcategories: topSubs,
      regularSubcategories: topSubs.length > 0 ? regularSubs : sorted,
      hasAnalytics: topSubs.length > 0,
    };
  }, [selectedCategory, expenses]);

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

  useEffect(() => {
    if (expenseType === 'GROUP' && selectedGroupId) {
      groupService
        .getGroupById(selectedGroupId)
        .then((res: any) => {
          const grp = res?.data || res;
          if (grp) {
            setSelectedGroupDetails(grp);
            const memberIds = (grp.members || []).map(
              (m: any) => m.user?.id || m.userId,
            );
            setSelectedParticipantIds(
              memberIds.length > 0 ? memberIds : user?.id ? [user.id] : [],
            );
          }
        })
        .catch(() => {});
    }
  }, [expenseType, selectedGroupId, user]);

  const handleCategorySelect = (cat: CategoryInfo) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('');
    setIsCategoryExpanded(false); // Wrap/collapse category into compact card!
    setError('');

    setTimeout(() => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        if (subCategoryLayoutY.current > 0) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, subCategoryLayoutY.current - 15),
            animated: true,
          });
        }
      } else {
        // If no subcategories, scroll up to Amount and focus
        if (amountLayoutY.current >= 0) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, amountLayoutY.current - 15),
            animated: true,
          });
        }
        amountInputRef.current?.focus();
      }
    }, 180);
  };

  const handleSubcategorySelect = (sub: string) => {
    setSelectedSubcategory(sub);
    setTimeout(() => {
      // Scroll smoothly up to Amount section and focus
      if (amountLayoutY.current >= 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, amountLayoutY.current - 15),
          animated: true,
        });
      }
      amountInputRef.current?.focus();
    }, 180);
  };

  const handleSubmit = async () => {
    setError('');

    if (!selectedCategory) {
      setError('Please select a category first.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount.');
      amountInputRef.current?.focus();
      return;
    }

    if (expenseType === 'GROUP' && !selectedGroupId) {
      setError('Please select a group to add this expense to.');
      return;
    }

    if (expenseType === 'GROUP' && selectedParticipantIds.length === 0) {
      setError('Please select at least one member to share this expense.');
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
        onClose('PERSONAL');
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
          participants: selectedParticipantIds.map((id) => ({ userId: id })),
        } as any);
        onClose('GROUP', selectedGroupId);
      }
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
          <TouchableOpacity onPress={() => onClose()} className="p-1.5" activeOpacity={0.7}>
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal vs Group Switcher */}
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

          {/* Group Selector */}
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

              {/* Group Participant Selector: Who shares this expense */}
              {((selectedGroupDetails?.members && selectedGroupDetails.members.length > 0) ||
                (selectedGroup?.members && selectedGroup.members.length > 0)) && (
                <View className="bg-card rounded-2xl p-3.5 border border-border shadow-2xs gap-2 mt-1">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1.5">
                      <Feather name="users" size={13} color="#4F46E5" />
                      <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Split with ({selectedParticipantIds.length}/
                        {(selectedGroupDetails?.members || selectedGroup?.members || []).length})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const allList = selectedGroupDetails?.members || selectedGroup?.members || [];
                        const allIds = allList.map((m: any) => m.user?.id || m.userId);
                        if (selectedParticipantIds.length === allIds.length) {
                          setSelectedParticipantIds(user?.id ? [user.id] : []);
                        } else {
                          setSelectedParticipantIds(allIds);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-[11px] font-bold text-primary">
                        {selectedParticipantIds.length ===
                        (selectedGroupDetails?.members || selectedGroup?.members || []).length
                          ? 'Deselect Others'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5 pt-0.5">
                    {(selectedGroupDetails?.members || selectedGroup?.members || []).map((m: any) => {
                      const mId = m.user?.id || m.userId;
                      const isSelected = selectedParticipantIds.includes(mId);
                      const isYou = mId === user?.id;
                      const name = isYou ? 'You' : m.user?.name || m.user?.username || 'Member';

                      return (
                        <TouchableOpacity
                          key={mId}
                          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                            isSelected
                              ? 'bg-primary-light border-primary'
                              : 'bg-background border-border opacity-60'
                          }`}
                          onPress={() => {
                            if (isSelected) {
                              if (selectedParticipantIds.length > 1) {
                                setSelectedParticipantIds(
                                  selectedParticipantIds.filter((id) => id !== mId),
                                );
                              }
                            } else {
                              setSelectedParticipantIds([...selectedParticipantIds, mId]);
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
                              isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
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
            </View>
          )}

          {/* 1. AMOUNT (৳) SECTION - Placed on TOP above Categories */}
          <View
            ref={amountSectionRef}
            onLayout={(e) => {
              amountLayoutY.current = e.nativeEvent.layout.y;
            }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                AMOUNT (৳) *
              </Text>
              {selectedCategory && (
                <View className="flex-row items-center gap-1 bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <Text className="text-[11px]">{selectedCategory.emoji}</Text>
                  <Text className="text-[11px] font-bold text-primary" numberOfLines={1}>
                    {selectedSubcategory || selectedCategory.name}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center bg-background border-2 border-border rounded-xl px-4 h-14">
              <Text className="text-2xl font-extrabold text-primary mr-2">৳</Text>
              <TextInput
                ref={amountInputRef}
                className="flex-1 text-2xl font-extrabold text-foreground h-full"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {expenseType === 'GROUP' && numAmount > 0 && selectedParticipantIds.length > 0 && (
              <View className="flex-row items-center justify-between bg-primary-light px-3 py-2 rounded-xl border border-blue-200 mt-2.5">
                <Text className="text-xs text-primary font-semibold">
                  Split between {selectedParticipantIds.length} members:
                </Text>
                <Text className="text-xs font-extrabold text-primary">
                  ৳{Math.round(numAmount / selectedParticipantIds.length).toLocaleString()}/person
                </Text>
              </View>
            )}
          </View>

          {/* 2. CATEGORY SELECTION SECTION (Collapses/Wraps when selected, expandable on tap) */}
          <View className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3.5">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1.5">
                <Feather name="grid" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CATEGORY *
                </Text>
              </View>
              {selectedCategory && (
                <TouchableOpacity
                  onPress={() => setIsCategoryExpanded(!isCategoryExpanded)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1 bg-primary-light px-2.5 py-1 rounded-full border border-indigo-200"
                >
                  <Text className="text-xs">{selectedCategory.emoji}</Text>
                  <Text className="text-xs font-bold text-primary">
                    {selectedCategory.name}
                  </Text>
                  <Feather
                    name={isCategoryExpanded ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color="#4F46E5"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Collapsed / Wrapped Category View */}
            {!isCategoryExpanded && selectedCategory ? (
              <TouchableOpacity
                onPress={() => setIsCategoryExpanded(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between bg-primary-light/60 border-2 border-primary/30 rounded-2xl p-3"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center shadow-xs">
                    <Text className="text-xl">{selectedCategory.emoji}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Selected Category
                    </Text>
                    <Text className="text-sm font-black text-primary">
                      {selectedCategory.name}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1 bg-card px-2.5 py-1.5 rounded-xl border border-border">
                  <Feather name="edit-2" size={12} color="#4F46E5" />
                  <Text className="text-xs font-bold text-primary">Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* Expanded Category Selection View */
              <View className="gap-3.5">
                {/* Line 1: Analytics-driven Top Categories (#1 strictly first) */}
                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAnalyticsBased ? '✨ Your Most Used Categories' : '🔥 Popular Categories'}
                    </Text>
                    {isAnalyticsBased && (
                      <Text className="text-[10px] font-semibold text-primary">
                        Ranked by your history
                      </Text>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-0.5"
                  >
                    {topCategories.map((cat, idx) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-primary-light border-2 border-primary shadow-xs'
                              : 'bg-background border border-border'
                          }`}
                          onPress={() => handleCategorySelect(cat)}
                          activeOpacity={0.7}
                        >
                          <Text className="text-lg">{cat.emoji}</Text>
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {cat.name}
                          </Text>
                          {isAnalyticsBased && idx === 0 && (
                            <View className="bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300">
                              <Text className="text-[9px] font-black text-amber-700">#1</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Line 2: Other Categories & Search */}
                <View className="gap-2 pt-2 border-t border-border">
                  <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {categorySearchQuery ? 'Search Results' : 'Other Categories'}
                  </Text>
                  <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
                    <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput
                      className="flex-1 text-xs text-foreground"
                      placeholder="Search categories (e.g. Health, Education, Bills)..."
                      placeholderTextColor="#94A3B8"
                      value={categorySearchQuery}
                      onChangeText={setCategorySearchQuery}
                    />
                    {categorySearchQuery ? (
                      <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                        <Feather name="x" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-0.5"
                  >
                    {otherCategories.map((cat) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                            isSelected
                              ? 'bg-primary-light border-2 border-primary'
                              : 'bg-background border border-border'
                          }`}
                          onPress={() => handleCategorySelect(cat)}
                          activeOpacity={0.7}
                        >
                          <Text className="text-sm">{cat.emoji}</Text>
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
                </View>
              </View>
            )}
          </View>

          {/* 3. SUBCATEGORY SECTION (Auto-scrolled on category select, auto-scrolls to Amount on subcategory select) */}
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <View
              ref={subCategorySectionRef}
              onLayout={(e) => {
                subCategoryLayoutY.current = e.nativeEvent.layout.y;
              }}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-1.5">
                  <Feather name="tag" size={14} color="#4F46E5" />
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    SUBCATEGORY (OPTIONAL)
                  </Text>
                </View>
                {selectedSubcategory ? (
                  <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                    <Text className="text-[11px] font-bold text-primary">
                      {selectedSubcategory}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Frequent Subcategories from Analytics (if any) */}
              {analyzedSubcategories.hasAnalytics && analyzedSubcategories.topSubcategories.length > 0 && (
                <View className="gap-1.5">
                  <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    ⚡ Frequent in {selectedCategory.name}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-0.5"
                  >
                    {analyzedSubcategories.topSubcategories.map((sub) => {
                      const isSubSelected = selectedSubcategory === sub;
                      return (
                        <TouchableOpacity
                          key={`top-${sub}`}
                          className={`px-3 py-1.5 rounded-xl border transition-all ${
                            isSubSelected
                              ? 'bg-primary-light border-2 border-primary shadow-xs'
                              : 'bg-primary/5 border border-indigo-200'
                          }`}
                          onPress={() => handleSubcategorySelect(isSubSelected ? '' : sub)}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              isSubSelected ? 'text-primary font-black' : 'text-primary'
                            }`}
                          >
                            ⭐ {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* All / Regular Subcategories */}
              <View className="gap-1.5">
                {analyzedSubcategories.hasAnalytics && (
                  <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    All Subcategories
                  </Text>
                )}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 py-1"
                >
                  {analyzedSubcategories.regularSubcategories.map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        className={`px-3 py-1.5 rounded-xl border transition-all ${
                          isSubSelected
                            ? 'bg-primary-light border-2 border-primary shadow-xs'
                            : 'bg-background border border-border'
                        }`}
                        onPress={() => handleSubcategorySelect(isSubSelected ? '' : sub)}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            isSubSelected ? 'text-primary font-black' : 'text-foreground'
                          }`}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* 4. OPTIONAL ITEM TITLE & NOTES SECTION */}
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
        </ScrollView>

        {/* 5. STICKY BOTTOM ACTION BAR FOR SEAMLESS UI/UX */}
        <View className="px-4 py-3 bg-card border-t border-border shadow-lg">
          <Button
            variant="default"
            className="w-full py-3.5 rounded-2xl shadow-md bg-primary"
            textClassName="text-white font-bold text-sm"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            {`Save Expense ${numAmount > 0 ? `• ৳${numAmount.toLocaleString()}` : ''}`}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <CreateGroupModal
        visible={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={fetchGroups}
      />
    </SafeAreaView>
  );
};
