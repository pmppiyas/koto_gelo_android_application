import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Button,
} from '../components/ui';
import { EXPENSE_CATEGORIES, CategoryInfo } from '../constants/expense';
import { useExpenses, useAuth } from '../store/hooks';
import { getLocalDateString, formatExpenseDateForServer } from '../utils/date';
import { groupService, Group } from '../services/groupService';
import { localGroupService } from '../services/localGroupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';

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

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onClose,
  initialType = 'PERSONAL',
  initialGroupId,
}) => {
  const { addExpense, expenses } = useExpenses();
  const { user, isAuthenticated } = useAuth();

  const [expenseType, setExpenseType] = useState<'PERSONAL' | 'GROUP'>(
    initialType,
  );
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(
    null,
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || '',
  );
  const [selectedGroupDetails, setSelectedGroupDetails] =
    useState<Group | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const amountInputRef = useRef<any>(null);
  const subCategorySectionRef = useRef<any>(null);
  const amountSectionRef = useRef<any>(null);
  const subCategoryLayoutY = useRef<number>(0);
  const amountLayoutY = useRef<number>(0);
  const shouldScrollToSubcategoryRef = useRef<boolean>(false);

  // 1. Analytics-driven Ranked Categories: Strictly ranks highest used category first (#1, #2, ...)
  const { rankedCategories, categoryFrequency } = useMemo(() => {
    const freqMap: Record<string, number> = {};
    const spendMap: Record<string, number> = {};

    (expenses || []).forEach(e => {
      const catName = e.category?.trim();
      if (!catName) return;
      const lower = catName.toLowerCase();
      freqMap[lower] = (freqMap[lower] || 0) + 1;
      spendMap[lower] = (spendMap[lower] || 0) + (Number(e.amount) || 0);
    });

    const getScore = (c: CategoryInfo) => {
      const freq =
        (freqMap[c.name.toLowerCase()] || 0) +
        (freqMap[c.id.toLowerCase()] || 0) +
        (freqMap[c.slug.toLowerCase()] || 0);
      const spend =
        (spendMap[c.name.toLowerCase()] || 0) +
        (spendMap[c.id.toLowerCase()] || 0) +
        (spendMap[c.slug.toLowerCase()] || 0);
      return { freq, spend };
    };

    // Sort all categories strictly by frequency descending, then spend descending
    let sorted = [...EXPENSE_CATEGORIES].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreB.freq !== scoreA.freq) return scoreB.freq - scoreA.freq;
      if (scoreB.spend !== scoreA.spend) return scoreB.spend - scoreA.spend;
      return a.name.localeCompare(b.name);
    });

    const totalUsed = sorted.filter(c => getScore(c).freq > 0).length;

    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.trim().toLowerCase();
      sorted = sorted.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.subcategories.some(s => s.toLowerCase().includes(q)),
      );
    }

    return {
      rankedCategories: sorted,
      isAnalyticsBased: totalUsed > 0,
      categoryFrequency: freqMap,
    };
  }, [expenses, categorySearchQuery]);

  // 2. Analytics-driven Subcategories for the selected category
  const analyzedSubcategories = useMemo(() => {
    if (!selectedCategory || !selectedCategory.subcategories?.length) {
      return {
        topSubcategories: [],
        allSortedSubcategories: [],
        hasAnalytics: false,
      };
    }

    const subFreq: Record<string, number> = {};
    (expenses || []).forEach(e => {
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
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });

    const topSubs = sorted.filter(s => (subFreq[s.toLowerCase()] || 0) > 0);

    return {
      topSubcategories: topSubs,
      allSortedSubcategories: sorted,
      hasAnalytics: topSubs.length > 0,
    };
  }, [selectedCategory, expenses]);

  // Instant 0ms offline load for groups on mount
  useEffect(() => {
    let isCurrent = true;

    const loadCachedGroups = async () => {
      try {
        const cachedGroups = await localGroupService.getStoredGroups();
        if (isCurrent && cachedGroups && cachedGroups.length > 0) {
          setGroups(cachedGroups);
          const initialGrp =
            cachedGroups.find(g =>
              selectedGroupId ? g.id === selectedGroupId : false,
            ) || cachedGroups[0];
          if (initialGrp) {
            setSelectedGroupId(prev => (prev ? prev : initialGrp.id));
            if (initialGrp.members && initialGrp.members.length > 0) {
              setSelectedGroupDetails(initialGrp);
              const memberIds = initialGrp.members.map(
                (m: any) => m.user?.id || m.userId,
              );
              setSelectedParticipantIds(
                memberIds.length > 0 ? memberIds : user?.id ? [user.id] : [],
              );
            }
          }
        }
      } catch {}
    };

    loadCachedGroups();
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    if (groups.length === 0) {
      setIsLoadingGroups(true);
    }
    try {
      const response = await groupService.getGroups({ limit: 50 });
      const groupList =
        response?.groups ||
        response?.data?.groups ||
        (Array.isArray(response) ? response : []);
      const validList = Array.isArray(groupList) ? groupList : [];
      if (validList.length > 0) {
        setGroups(validList);
        localGroupService.setStoredGroups(validList).catch(() => {});
        setSelectedGroupId(prev => {
          if (!prev && validList.length > 0) {
            return validList[0].id;
          }
          return prev;
        });
      }
    } catch {
    } finally {
      setIsLoadingGroups(false);
    }
  }, [isAuthenticated, groups.length]);

  useEffect(() => {
    if (expenseType === 'GROUP') {
      fetchGroups();
    }
  }, [expenseType, fetchGroups]);

  // Instant 0ms load group details / members from local cache first, then sync from server
  useEffect(() => {
    if (expenseType === 'GROUP' && selectedGroupId) {
      let isCurrent = true;

      // 1. Instant 0ms cache check for selected group members
      localGroupService
        .getStoredGroupById(selectedGroupId)
        .then(cachedGrp => {
          if (
            isCurrent &&
            cachedGrp &&
            cachedGrp.members &&
            cachedGrp.members.length > 0
          ) {
            setSelectedGroupDetails(cachedGrp);
            const memberIds = cachedGrp.members.map(
              (m: any) => m.user?.id || m.userId,
            );
            setSelectedParticipantIds(
              memberIds.length > 0 ? memberIds : user?.id ? [user.id] : [],
            );
          }
        })
        .catch(() => {});

      // 2. Fresh background fetch from server
      groupService
        .getGroupById(selectedGroupId)
        .then((res: any) => {
          if (!isCurrent) return;
          const grp = res?.data || res;
          if (grp) {
            setSelectedGroupDetails(grp);
            localGroupService.saveGroupLocally(grp, 'synced').catch(() => {});
            const memberIds = (grp.members || []).map(
              (m: any) => m.user?.id || m.userId,
            );
            setSelectedParticipantIds(
              memberIds.length > 0 ? memberIds : user?.id ? [user.id] : [],
            );
          }
        })
        .catch(() => {});
      return () => {
        isCurrent = false;
      };
    }
  }, [expenseType, selectedGroupId, user?.id]);

  const handleCategorySelect = (cat: CategoryInfo) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('');
    setError('');
    shouldScrollToSubcategoryRef.current = true;

    // If subCategoryLayoutY is already known (when switching category), scroll immediately
    if (subCategoryLayoutY.current > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, subCategoryLayoutY.current - 15),
          animated: true,
        });
        shouldScrollToSubcategoryRef.current = false;
      }, 80);
    }
  };

  const handleSubcategorySelect = (sub: string) => {
    setSelectedSubcategory(sub);
    setError('');

    // If amount is not entered yet, smooth scroll up to Amount section and focus
    if (!amount || parseFloat(amount) <= 0) {
      setTimeout(() => {
        if (amountLayoutY.current >= 0) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, amountLayoutY.current - 15),
            animated: true,
          });
        }
        amountInputRef.current?.focus();
      }, 150);
    }
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
          participants: selectedParticipantIds.map(id => ({ userId: id })),
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
    () => groups.find(g => g.id === selectedGroupId),
    [groups, selectedGroupId],
  );
  const memberCount = selectedGroup?.members?.length || 1;
  const numAmount = parseFloat(amount) || 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
              <Feather name="plus-circle" size={18} color="#4F46E5" />
            </View>
            <Text className="text-base font-bold text-foreground">
              Add New Expense
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onClose()}
            className="p-1.5"
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="px-3 py-1.5 gap-2.5"
          contentContainerStyle={{ paddingBottom: 8 }}
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
                  expenseType === 'PERSONAL'
                    ? 'text-primary'
                    : 'text-muted-foreground'
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
                  expenseType === 'GROUP'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Group / Mess Split
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl border border-rose-200">
              <Feather name="alert-circle" size={15} color="#EF4444" />
              <Text className="text-xs text-destructive font-medium flex-1">
                {error}
              </Text>
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
                  <Text className="text-xs font-bold text-primary">
                    + Create Group
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingGroups && groups.length === 0 ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <ScrollView
                  horizontal
                  nestedScrollEnabled={true}
                  directionalLockEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2 py-1"
                  keyboardShouldPersistTaps="always"
                >
                  {groups.map((grp, index) => {
                    const isSelected = selectedGroupId === grp.id;
                    const emoji = TYPE_EMOJI[grp.type] || '👥';
                    return (
                      <TouchableOpacity
                        key={`${grp.id}_${index}`}
                        className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                          isSelected
                            ? 'bg-primary-light border-primary'
                            : 'bg-card border-border'
                        }`}
                        onPress={() => {
                          setSelectedGroupId(grp.id);
                          setSelectedGroupDetails(grp);
                          const memberIds = (grp.members || []).map(
                            (m: any) => m.user?.id || m.userId,
                          );
                          if (memberIds.length > 0) {
                            setSelectedParticipantIds(memberIds);
                          }
                        }}
                        activeOpacity={0.6}
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
              {((selectedGroupDetails?.members &&
                selectedGroupDetails.members.length > 0) ||
                (selectedGroup?.members &&
                  selectedGroup.members.length > 0)) && (
                <View className="bg-card rounded-2xl p-3.5 border border-border shadow-2xs gap-2 mt-1">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1.5">
                      <Feather name="users" size={13} color="#4F46E5" />
                      <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Split with ({selectedParticipantIds.length}/
                        {
                          (
                            selectedGroupDetails?.members ||
                            selectedGroup?.members ||
                            []
                          ).length
                        }
                        )
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const allList =
                          selectedGroupDetails?.members ||
                          selectedGroup?.members ||
                          [];
                        const allIds = allList.map(
                          (m: any) => m.user?.id || m.userId,
                        );
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
                        (
                          selectedGroupDetails?.members ||
                          selectedGroup?.members ||
                          []
                        ).length
                          ? 'Deselect Others'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5 pt-0.5">
                    {(
                      selectedGroupDetails?.members ||
                      selectedGroup?.members ||
                      []
                    ).map((m: any) => {
                      const mId = m.user?.id || m.userId;
                      const isSelected = selectedParticipantIds.includes(mId);
                      const isYou = mId === user?.id;
                      const name = isYou
                        ? 'You'
                        : m.user?.name || m.user?.username || 'Member';

                      return (
                        <TouchableOpacity
                          key={`${mId || 'm'}_${m.id || ''}`}
                          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                            isSelected
                              ? 'bg-primary-light border-primary'
                              : 'bg-background border-border opacity-60'
                          }`}
                          onPress={() => {
                            if (isSelected) {
                              if (selectedParticipantIds.length > 1) {
                                setSelectedParticipantIds(
                                  selectedParticipantIds.filter(
                                    id => id !== mId,
                                  ),
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
            </View>
          )}

          {/* 1. AMOUNT (৳) SECTION - Placed on TOP above Categories */}
          <View
            ref={amountSectionRef}
            onLayout={e => {
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
                  <Text
                    className="text-[11px] font-bold text-primary"
                    numberOfLines={1}
                  >
                    {selectedSubcategory || selectedCategory.name}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center bg-background border-2 border-border rounded-xl px-4 h-14">
              <Text className="text-2xl font-extrabold text-primary mr-2">
                ৳
              </Text>
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

            {expenseType === 'GROUP' &&
              numAmount > 0 &&
              selectedParticipantIds.length > 0 && (
                <View className="flex-row items-center justify-between bg-primary-light px-3 py-2 rounded-xl border border-blue-200 mt-2.5">
                  <Text className="text-xs text-primary font-semibold">
                    Split between {selectedParticipantIds.length} members:
                  </Text>
                  <Text className="text-xs font-extrabold text-primary">
                    ৳
                    {Math.round(
                      numAmount / selectedParticipantIds.length,
                    ).toLocaleString()}
                    /person
                  </Text>
                </View>
              )}
          </View>

          {/* 2. CATEGORY SELECTION SECTION (Grid of badges sorted by usage frequency) */}
          <View className="bg-card rounded-2xl p-4 border border-border shadow-sm gap-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1.5">
                <Feather name="grid" size={14} color="#4F46E5" />
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CATEGORY *
                </Text>
              </View>
            </View>

            {/* Category Search Input */}
            <View className="flex-row items-center bg-background border border-border rounded-xl px-3 h-10">
              <Feather
                name="search"
                size={14}
                color="#94A3B8"
                style={{ marginRight: 6 }}
              />
              <TextInput
                className="flex-1 text-xs text-foreground"
                placeholder="Search category (e.g. Food, Transport, Bills)..."
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

            {/* Category Badges in Responsive Grid */}
            <View className="flex-row flex-wrap gap-2 pt-0.5">
              {rankedCategories.map((cat, idx) => {
                const isSelected = selectedCategory?.id === cat.id;
                const freq =
                  (categoryFrequency[cat.name.toLowerCase()] || 0) +
                  (categoryFrequency[cat.id.toLowerCase()] || 0) +
                  (categoryFrequency[cat.slug.toLowerCase()] || 0);
                const isTopFrequent = idx < 3 && freq > 0;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border ${
                      isSelected
                        ? 'bg-primary border-primary shadow-xs'
                        : isTopFrequent
                        ? 'bg-indigo-50/80 border-indigo-200'
                        : 'bg-background border-border'
                    }`}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base">{cat.emoji}</Text>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-white'
                          : isTopFrequent
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {cat.name}
                    </Text>
                    {isTopFrequent && !isSelected && (
                      <View className="bg-primary/20 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-black text-primary">
                          #{idx + 1}
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <Feather name="check" size={13} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. SUBCATEGORY SELECTION SECTION (Auto-scrolled on category select, prompt banner & badge grid) */}
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <View
              ref={subCategorySectionRef}
              onLayout={e => {
                const y = e.nativeEvent.layout.y;
                subCategoryLayoutY.current = y;
                if (shouldScrollToSubcategoryRef.current) {
                  shouldScrollToSubcategoryRef.current = false;
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                      y: Math.max(0, y - 15),
                      animated: true,
                    });
                  }, 40);
                }
              }}
              className="bg-card rounded-2xl p-4 border-2 border-indigo-300/80 shadow-md gap-3"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-1.5">
                  <Feather name="tag" size={14} color="#4F46E5" />
                  <Text className="text-xs font-bold text-primary uppercase tracking-wider">
                    SUBCATEGORY *
                  </Text>
                </View>
                {selectedSubcategory ? (
                  <View className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex-row items-center gap-1">
                    <Feather name="check-circle" size={11} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-700">
                      {selectedSubcategory}
                    </Text>
                  </View>
                ) : (
                  <View className="bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <Text className="text-[10px] font-bold text-amber-800">
                      Required
                    </Text>
                  </View>
                )}
              </View>

              {/* Subcategories Badge Grid */}
              <View className="flex-row flex-wrap gap-2 pt-0.5">
                {analyzedSubcategories.allSortedSubcategories.map(sub => {
                  const isSelected = selectedSubcategory === sub;
                  const isTopSub =
                    analyzedSubcategories.topSubcategories.includes(sub);

                  return (
                    <TouchableOpacity
                      key={sub}
                      className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-primary border-primary shadow-xs'
                          : isTopSub
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-background border-border'
                      }`}
                      onPress={() => handleSubcategorySelect(sub)}
                      activeOpacity={0.7}
                    >
                      {isTopSub && !isSelected && (
                        <Text className="text-xs">⭐</Text>
                      )}
                      <Text
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-white'
                            : isTopSub
                            ? 'text-amber-900'
                            : 'text-foreground'
                        }`}
                      >
                        {sub}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
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

        {/* 5. STICKY BOTTOM ACTION BAR (Save Expense Visible once subcategory is selected) */}
        <View className="px-4 py-3 bg-card border-t border-border shadow-lg">
          {!selectedCategory ? (
            <View className="py-3 px-4 rounded-2xl bg-muted/70 items-center justify-center flex-row gap-2 border border-border">
              <Feather name="grid" size={15} color="#64748B" />
              <Text className="text-xs font-bold text-muted-foreground">
                Step 1: Select a category above
              </Text>
            </View>
          ) : !selectedSubcategory ? (
            <TouchableOpacity
              onPress={() => {
                if (subCategoryLayoutY.current > 0) {
                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, subCategoryLayoutY.current - 15),
                    animated: true,
                  });
                }
              }}
              activeOpacity={0.8}
              className="py-3 px-4 rounded-2xl bg-amber-100 border-2 border-amber-400 items-center justify-center flex-row gap-2 shadow-xs"
            >
              <Feather name="arrow-down-circle" size={16} color="#B45309" />
              <Text className="text-xs font-extrabold text-amber-900">
                Step 2: Select a subcategory to Save Expense
              </Text>
            </TouchableOpacity>
          ) : (
            <Button
              variant="default"
              className="w-full py-3.5 rounded-2xl shadow-md bg-primary"
              textClassName="text-white font-bold text-sm"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {`Save Expense ${
                numAmount > 0 ? `• ৳${numAmount.toLocaleString()}` : ''
              }`}
            </Button>
          )}
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
