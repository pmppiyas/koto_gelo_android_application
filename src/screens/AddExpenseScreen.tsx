import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography } from '../constants/spacing';
import { EXPENSE_CATEGORIES, CategoryInfo } from '../constants/expense';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { useExpenses, useAuth } from '../store/hooks';
import { getLocalDateString, formatExpenseDateForServer } from '../utils/date';
import { groupService, Group } from '../services/groupService';
import { CreateGroupModal } from '../components/group/CreateGroupModal';

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
  const { width } = useWindowDimensions();
  const { addExpense } = useExpenses();
  const { isAuthenticated } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const amountInputRef = useRef<TextInput>(null);

  const [expenseType, setExpenseType] = useState<'PERSONAL' | 'GROUP'>('PERSONAL');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState<boolean>(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categorySectionY, setCategorySectionY] = useState<number>(0);

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGroups(true);
    try {
      const res = await groupService.getGroups({ limit: 50 });
      const list = res?.groups || res?.data?.groups || res || [];
      if (Array.isArray(list)) {
        setGroups(list);
        if (list.length > 0 && !selectedGroup) {
          setSelectedGroup(list[0]);
        }
      }
    } catch {} finally {
      setIsLoadingGroups(false);
    }
  }, [isAuthenticated, selectedGroup]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const numCols = 4;
  const horizontalPadding = spacing.md * 2;
  const gap = 8;
  const cardWidth = (width - horizontalPadding - (numCols - 1) * gap) / numCols;

  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return EXPENSE_CATEGORIES;

    return EXPENSE_CATEGORIES.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchSub = cat.subcategories.some((sub) => sub.toLowerCase().includes(q));
      return matchName || matchSub;
    });
  }, [categorySearchQuery]);

  const matchingSubcategories = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: { category: CategoryInfo; subcategory: string }[] = [];
    for (const cat of EXPENSE_CATEGORIES) {
      for (const sub of cat.subcategories) {
        if (sub.toLowerCase().includes(q)) {
          results.push({ category: cat, subcategory: sub });
        }
      }
    }
    return results.slice(0, 8);
  }, [categorySearchQuery]);

  const handleCategorySelect = (cat: CategoryInfo) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('');
    setIsCategoryExpanded(false);
    setCategorySearchQuery('');
    setError('');

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, categorySectionY - 30),
        animated: true,
      });
    }, 80);
  };

  const handleQuickSubcategorySelect = (cat: CategoryInfo, sub: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setTitle(sub);
    setIsCategoryExpanded(false);
    setCategorySearchQuery('');
    setError('');

    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 280);
  };

  const handleSubcategorySelect = (sub: string) => {
    const isDeselecting = selectedSubcategory === sub;
    const newSub = isDeselecting ? '' : sub;
    setSelectedSubcategory(newSub);

    if (!isDeselecting) {
      setTitle(sub);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 280);
    }
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
    setError('');
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      amountInputRef.current?.focus();
      return;
    }

    if (!selectedCategory) {
      setError('Please select an expense category');
      setIsCategoryExpanded(true);
      return;
    }

    if (expenseType === 'GROUP' && !selectedGroup) {
      setError('Please select a group for this expense');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (expenseType === 'GROUP' && selectedGroup) {
        await groupService.addGroupExpense({
          groupId: selectedGroup.id,
          amount: numAmount,
          category: selectedCategory.name,
          subcategory: selectedSubcategory || undefined,
          title: title.trim() || selectedSubcategory || selectedCategory.name,
          note: note.trim() || undefined,
          expenseDate: formatExpenseDateForServer(date),
          splitType: 'EQUAL',
        });
      } else {
        await addExpense({
          amount: numAmount,
          category: selectedCategory.name,
          subcategory: selectedSubcategory || null,
          title: title.trim() || selectedSubcategory || selectedCategory.name,
          date,
          note: note.trim() || null,
          type: 'PERSONAL',
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberCount = selectedGroup?.members?.length || selectedGroup?._count?.members || 1;
  const numAmount = parseFloat(amount) || 0;
  const perPersonSplit = numAmount > 0 ? (numAmount / memberCount).toFixed(0) : '0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.typeSwitcher}>
            <TouchableOpacity
              style={[styles.typeBtn, expenseType === 'PERSONAL' && styles.typeBtnActive]}
              onPress={() => setExpenseType('PERSONAL')}
              activeOpacity={0.8}
            >
              <Feather
                name="user"
                size={16}
                color={expenseType === 'PERSONAL' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  expenseType === 'PERSONAL' && styles.typeBtnTextActive,
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, expenseType === 'GROUP' && styles.typeBtnActive]}
              onPress={() => {
                setExpenseType('GROUP');
                if (groups.length === 0) fetchGroups();
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="users"
                size={16}
                color={expenseType === 'GROUP' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  expenseType === 'GROUP' && styles.typeBtnTextActive,
                ]}
              >
                Group
              </Text>
            </TouchableOpacity>
          </View>

          {expenseType === 'GROUP' && (
            <View style={styles.groupSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>SELECT GROUP *</Text>
                <TouchableOpacity
                  onPress={() => setIsCreateGroupOpen(true)}
                  style={styles.createGroupLink}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={14} color={colors.primary} />
                  <Text style={styles.createGroupLinkText}>New Group</Text>
                </TouchableOpacity>
              </View>

              {isLoadingGroups ? (
                <View style={styles.groupLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.groupLoadingText}>Loading your groups...</Text>
                </View>
              ) : groups.length === 0 ? (
                <View style={styles.noGroupCard}>
                  <Feather name="users" size={24} color={colors.accent} />
                  <Text style={styles.noGroupTitle}>No Groups Found</Text>
                  <Text style={styles.noGroupSubtitle}>
                    Create a group first to split this expense with members.
                  </Text>
                  <TouchableOpacity
                    style={styles.noGroupCreateBtn}
                    onPress={() => setIsCreateGroupOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={styles.noGroupCreateBtnText}>Create a Group</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.groupChipList}
                  >
                    {groups.map((grp) => {
                      const isSelected = selectedGroup?.id === grp.id;
                      const emoji = TYPE_EMOJI[grp.type] || '📁';
                      const count = grp.members?.length || grp._count?.members || 1;

                      return (
                        <TouchableOpacity
                          key={grp.id}
                          style={[
                            styles.groupChip,
                            isSelected && styles.groupChipSelected,
                          ]}
                          onPress={() => {
                            setSelectedGroup(grp);
                            setError('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.groupChipEmoji}>{emoji}</Text>
                          <View>
                            <Text
                              style={[
                                styles.groupChipName,
                                isSelected && styles.groupChipNameSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {grp.name}
                            </Text>
                            <Text
                              style={[
                                styles.groupChipMembers,
                                isSelected && styles.groupChipMembersSelected,
                              ]}
                            >
                              {count} member{count === 1 ? '' : 's'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedGroup && (
                    <View style={styles.splitBanner}>
                      <Feather name="pie-chart" size={16} color={colors.primary} />
                      <Text style={styles.splitBannerText}>
                        Split equally among {memberCount} member{memberCount === 1 ? '' : 's'}
                      </Text>
                      {numAmount > 0 && (
                        <Text style={styles.splitBannerAmount}>
                          ৳{perPersonSplit}/person
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT (BDT ৳) *</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>৳</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError('');
                }}
                maxLength={10}
              />
            </View>

            <View style={styles.quickAmountRow}>
              {quickAmounts.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickAmountBtn}
                  onPress={() => handleQuickAmount(val)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAmountText}>+{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View
            style={styles.section}
            onLayout={(e) => setCategorySectionY(e.nativeEvent.layout.y)}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SELECT CATEGORY *</Text>
              {selectedCategory && !isCategoryExpanded ? (
                <TouchableOpacity
                  onPress={() => setIsCategoryExpanded(true)}
                  style={styles.toggleCategoryBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleCategoryText}>Change Category</Text>
                  <Feather name="chevron-down" size={14} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {!isCategoryExpanded && selectedCategory ? (
              <TouchableOpacity
                style={[
                  styles.selectedCategoryBanner,
                  { borderColor: selectedCategory.color, backgroundColor: `${selectedCategory.color}10` },
                ]}
                onPress={() => setIsCategoryExpanded(true)}
                activeOpacity={0.8}
              >
                <View style={styles.selectedCategoryLeft}>
                  <View
                    style={[
                      styles.selectedCategoryIconCircle,
                      { backgroundColor: selectedCategory.bgColor },
                    ]}
                  >
                    <Text style={styles.selectedCategoryEmoji}>{selectedCategory.emoji}</Text>
                  </View>
                  <View>
                    <Text style={[styles.selectedCategoryName, { color: selectedCategory.color }]}>
                      {selectedCategory.name}
                    </Text>
                    {selectedSubcategory ? (
                      <Text style={styles.selectedSubcategoryLabel}>
                        Subcategory: {selectedSubcategory}
                      </Text>
                    ) : (
                      <Text style={styles.selectedSubcategoryLabel}>Tap subcategories below</Text>
                    )}
                  </View>
                </View>
                <Feather name="check-circle" size={20} color={selectedCategory.color} />
              </TouchableOpacity>
            ) : (
              <View style={styles.categoryPickerCard}>
                <View style={styles.categorySearchContainer}>
                  <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="Search 35+ categories & subcategories..."
                    placeholderTextColor={colors.textMuted}
                    value={categorySearchQuery}
                    onChangeText={setCategorySearchQuery}
                  />
                  {categorySearchQuery ? (
                    <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                      <Feather name="x" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {matchingSubcategories.length > 0 && (
                  <View style={styles.directMatchesContainer}>
                    <Text style={styles.directMatchesLabel}>Direct Subcategory Matches:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.directMatchesScroll}>
                      {matchingSubcategories.map(({ category, subcategory }) => (
                        <TouchableOpacity
                          key={`${category.id}-${subcategory}`}
                          style={[styles.directMatchChip, { borderColor: category.color }]}
                          onPress={() => handleQuickSubcategorySelect(category, subcategory)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.directMatchEmoji}>{category.emoji}</Text>
                          <Text style={styles.directMatchText}>{subcategory}</Text>
                          <Text style={styles.directMatchCategoryTag}>in {category.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.categoryGrid}>
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          { width: cardWidth },
                          isSelected && styles.categoryCardSelected,
                          isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}12` },
                        ]}
                        onPress={() => handleCategorySelect(cat)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.categoryIconCircle,
                            { backgroundColor: isSelected ? `${cat.color}25` : cat.bgColor },
                          ]}
                        >
                          <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        </View>
                        <Text
                          style={[
                            styles.categoryName,
                            isSelected && { color: cat.color, fontWeight: '700' },
                          ]}
                          numberOfLines={2}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredCategories.length === 0 && (
                  <View style={styles.noCategoriesContainer}>
                    <Text style={styles.noCategoriesText}>No matching categories found</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {selectedCategory && selectedCategory.subcategories.length > 0 && !isCategoryExpanded && (
            <View style={styles.subcategorySection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.subcategoryHeaderLeft}>
                  <Text style={styles.subcategoryEmojiBadge}>{selectedCategory.emoji}</Text>
                  <Text style={styles.sectionLabel}>{selectedCategory.name.toUpperCase()} SUBCATEGORIES</Text>
                </View>
                {selectedSubcategory ? (
                  <TouchableOpacity onPress={() => setSelectedSubcategory('')}>
                    <Text style={styles.clearSubcategoryText}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.subcategoryWrapContainer}>
                {selectedCategory.subcategories.map((sub) => {
                  const isSelected = selectedSubcategory === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.subcategoryPill,
                        isSelected && [
                          styles.subcategoryPillSelected,
                          { backgroundColor: selectedCategory.color, borderColor: selectedCategory.color },
                        ],
                      ]}
                      onPress={() => handleSubcategorySelect(sub)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subcategoryPillText,
                          isSelected && styles.subcategoryPillTextSelected,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.formFields}>
            <AppInput
              label="Title / Description"
              placeholder={selectedSubcategory || selectedCategory?.name || 'e.g. Lunch, Milk, Uber'}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.dateContainer}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateRow}>
                <Feather name="calendar" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.dateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <AppInput
              label="Note (Optional)"
              placeholder="Add any extra notes..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={
              isSubmitting
                ? 'Saving...'
                : expenseType === 'GROUP'
                ? `Add to ${selectedGroup?.name || 'Group'}`
                : 'Add Personal Expense'
            }
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleSave}
            style={styles.submitBtn}
          />
        </View>

        <CreateGroupModal
          visible={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={() => {
            setIsCreateGroupOpen(false);
            fetchGroups();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  createGroupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createGroupLinkText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  groupLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  groupLoadingText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  noGroupCard: {
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noGroupTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
  },
  noGroupSubtitle: {
    fontSize: typography.xs,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noGroupCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  noGroupCreateBtnText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupChipList: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 130,
  },
  groupChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  groupChipEmoji: {
    fontSize: 22,
  },
  groupChipName: {
    fontSize: typography.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupChipNameSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  groupChipMembers: {
    fontSize: 10,
    color: colors.textMuted,
  },
  groupChipMembersSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  splitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  splitBannerText: {
    flex: 1,
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  splitBannerAmount: {
    fontSize: typography.xs,
    fontWeight: '800',
    color: colors.primary,
  },
  amountCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  amountLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: typography.hero,
    fontWeight: '900',
    color: colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickAmountBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  quickAmountText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  toggleCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleCategoryText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedCategoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  selectedCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedCategoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryEmoji: {
    fontSize: 22,
  },
  selectedCategoryName: {
    fontSize: typography.md,
    fontWeight: '700',
  },
  selectedSubcategoryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryPickerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.sm,
    height: 38,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: typography.xs,
    color: colors.textPrimary,
    padding: 0,
  },
  directMatchesContainer: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  directMatchesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  directMatchesScroll: {
    flexDirection: 'row',
  },
  directMatchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    marginRight: spacing.xs + 2,
    gap: 4,
  },
  directMatchEmoji: {
    fontSize: 13,
  },
  directMatchText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  directMatchCategoryTag: {
    fontSize: 9,
    color: colors.textMuted,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  categoryCardSelected: {
    borderWidth: 1.5,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 12,
  },
  noCategoriesContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noCategoriesText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  subcategorySection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subcategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  subcategoryEmojiBadge: {
    fontSize: 14,
  },
  clearSubcategoryText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  subcategoryWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  subcategoryPill: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  subcategoryPillSelected: {
    borderWidth: 1.5,
  },
  subcategoryPillText: {
    fontSize: typography.xs,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subcategoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formFields: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateContainer: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submitBtn: {
    width: '100%',
  },
});
