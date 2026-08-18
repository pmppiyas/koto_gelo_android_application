import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/expense';
import { groupService, GroupMember } from '../../services/groupService';
import { getLocalDateString, formatExpenseDateForServer } from '../../utils/date';

interface AddGroupExpenseModalProps {
  visible: boolean;
  groupId: string;
  members: GroupMember[];
  onClose: () => void;
  onExpenseAdded: () => void;
}

export const AddGroupExpenseModal: React.FC<AddGroupExpenseModalProps> = ({
  visible,
  groupId,
  members,
  onClose,
  onExpenseAdded,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'form' | 'category'>('form');

  const reset = () => {
    setTitle('');
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setStep('form');
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
      onExpenseAdded();
      handleClose();
    } catch {
      setIsSaving(false);
    }
  };

  const isValid = parseFloat(amount) > 0 && selectedCategory;

  if (step === 'category') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setStep('form')}>
        <View style={styles.overlay}>
          <View style={styles.sheetFull}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setStep('form')}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Select Category</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, isActive && styles.categoryItemActive]}
                    onPress={() => {
                      setSelectedCategory(cat.name);
                      setStep('form');
                    }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryName, isActive && styles.categoryNameActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Add Group Expense</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.amountSection}>
              <Text style={styles.currencySymbol}>৳</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => setStep('category')}
            >
              <Feather name="grid" size={18} color={colors.textSecondary} />
              <Text style={[styles.fieldText, !selectedCategory && styles.fieldPlaceholder]}>
                {selectedCategory || 'Select category'}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <Feather name="edit-3" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.textField}
                placeholder="Title (optional)"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputRow}>
              <Feather name="file-text" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.textField}
                placeholder="Note (optional)"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={styles.splitInfo}>
              <Feather name="users" size={16} color={colors.primary} />
              <Text style={styles.splitInfoText}>
                Split equally among {members.length} member{members.length !== 1 ? 's' : ''}
              </Text>
              {parseFloat(amount) > 0 && members.length > 0 && (
                <Text style={styles.splitAmount}>
                  ৳{(parseFloat(amount) / members.length).toFixed(0)}/person
                </Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  sheetFull: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flex: 1,
    marginTop: 60,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.textMuted,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 80,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  fieldText: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fieldPlaceholder: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  textField: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  splitInfoText: {
    flex: 1,
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  splitAmount: {
    fontSize: typography.xs,
    fontWeight: '800',
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sm,
    fontWeight: '800',
  },
});
