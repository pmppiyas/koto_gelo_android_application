import React, { useState, useMemo, useRef } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography } from '../constants/spacing';
import { EXPENSE_CATEGORIES, CategoryInfo } from '../constants/expense';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { useExpenses } from '../store/hooks';
import { getLocalDateString } from '../utils/date';

export interface AddExpenseScreenProps {
  onClose: () => void;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ onClose }) => {
  const { width } = useWindowDimensions();
  const { addExpense } = useExpenses();
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

    setError('');
    setIsSubmitting(true);

    try {
      await addExpense({
        amount: numAmount,
        category: selectedCategory.name,
        subcategory: selectedSubcategory || null,
        title: title.trim() || selectedSubcategory || selectedCategory.name,
        date,
        note: note.trim() || null,
        type: expenseType,
      });

      onClose();
    } catch {
      setError('Could not save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              onPress={() => setExpenseType('GROUP')}
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
            <View style={styles.groupNotice}>
              <Feather name="info" size={16} color={colors.accent} style={styles.noticeIcon} />
              <Text style={styles.groupNoticeText}>
                Group expenses are saved locally and synced directly to your group database when online.
              </Text>
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
                <View
                  style={[
                    styles.selectedCategoryIconCircle,
                    { backgroundColor: selectedCategory.bgColor },
                  ]}
                >
                  <Text style={styles.categoryEmojiLarge}>{selectedCategory.emoji}</Text>
                </View>
                <View style={styles.selectedCategoryTextCol}>
                  <Text style={[styles.selectedCategoryTitle, { color: selectedCategory.color }]}>
                    {selectedCategory.name}
                  </Text>
                  <Text style={styles.selectedCategoryHint}>
                    {selectedSubcategory ? `Selected: ${selectedSubcategory}` : 'Tap below to select subcategory'}
                  </Text>
                </View>
                <View style={styles.changeBtnBadge}>
                  <Feather name="edit-2" size={14} color={selectedCategory.color} />
                  <Text style={[styles.changeBtnText, { color: selectedCategory.color }]}>Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.categorySearchContainer}>
                  <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="Search category or item (e.g. coffee, bKash, gym)..."
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
                  <View style={styles.matchingSubContainer}>
                    <Text style={styles.matchingSubLabel}>DIRECT MATCHES:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchingSubScroll}>
                      {matchingSubcategories.map(({ category, subcategory }) => (
                        <TouchableOpacity
                          key={`${category.id}_${subcategory}`}
                          style={styles.directMatchChip}
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
            title={isSubmitting ? 'Saving...' : 'Add Expense'}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleSave}
            style={styles.submitBtn}
          />
        </View>
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
  groupNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  noticeIcon: {
    marginRight: spacing.sm,
  },
  groupNoticeText: {
    flex: 1,
    fontSize: typography.xs,
    color: '#92400E',
    fontWeight: '500',
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
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: typography.hero + 6,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  quickAmountBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  quickAmountText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.danger,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  toggleCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleCategoryText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  selectedCategoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    backgroundColor: colors.surfaceCard,
  },
  selectedCategoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  categoryEmojiLarge: {
    fontSize: 22,
  },
  selectedCategoryTextCol: {
    flex: 1,
  },
  selectedCategoryTitle: {
    fontSize: typography.md,
    fontWeight: '700',
  },
  selectedCategoryHint: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  matchingSubContainer: {
    marginBottom: spacing.sm,
  },
  matchingSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  matchingSubScroll: {
    gap: spacing.xs + 2,
  },
  directMatchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  directMatchEmoji: {
    fontSize: 14,
  },
  directMatchText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  directMatchCategoryTag: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 78,
  },
  categoryCardSelected: {
    borderWidth: 2,
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
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noCategoriesText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  subcategorySection: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  subcategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subcategoryEmojiBadge: {
    fontSize: 16,
  },
  clearSubcategoryText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subcategoryWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  subcategoryPill: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.full,
  },
  subcategoryPillSelected: {
    borderColor: colors.primary,
  },
  subcategoryPillText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subcategoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formFields: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateContainer: {
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    fontSize: typography.md,
    color: colors.textPrimary,
    height: '100%',
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
