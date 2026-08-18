import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography } from '../constants/spacing';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';

export interface AddExpenseScreenProps {
  onClose: () => void;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setError('');
    onClose();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.amountContainer}>
            <Text style={styles.currencyPrefix}>৳</Text>
            <TextInput
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.formContainer}>
            <AppInput
              label="Title"
              placeholder="What did you spend on?"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError('');
              }}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selectedCategory === cat ? styles.categoryChipActive : styles.categoryChipInactive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, selectedCategory === cat ? styles.categoryChipTextActive : styles.categoryChipTextInactive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateDisplay}>
                <Feather name="calendar" size={20} color={colors.textSecondary} style={styles.dateIcon} />
                <Text style={styles.dateText}>Today</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <AppInput
                label="Notes (optional)"
                placeholder="Add a note..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title="Save Expense"
            variant="primary"
            size="lg"
            onPress={handleSave}
            style={styles.saveButton}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  currencyPrefix: {
    fontSize: typography.xxl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.xs,
    marginTop: 8,
  },
  amountInput: {
    fontSize: typography.hero,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  formContainer: {
    gap: spacing.lg,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoryScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  categoryChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: colors.borderLight,
  },
  categoryChipText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipTextInactive: {
    color: colors.textSecondary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateIcon: {
    marginRight: spacing.sm,
  },
  dateText: {
    fontSize: typography.md,
    color: colors.textPrimary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  saveButton: {
    width: '100%',
  },
});
