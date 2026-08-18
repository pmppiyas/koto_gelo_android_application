import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';
import { groupService, CreateGroupPayload } from '../../services/groupService';

export interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const GROUP_TYPES = [
  { id: 'MESS', label: 'Mess / Hostel', emoji: '🍲', desc: 'Meals, rent & utilities' },
  { id: 'FRIENDS', label: 'Friends', emoji: '👥', desc: 'Hangouts, dining & parties' },
  { id: 'TOUR', label: 'Tour', emoji: '🎒', desc: 'Travel & vacation trips' },
  { id: 'TRIP', label: 'Trip / Outing', emoji: '✈️', desc: 'Day trips & events' },
  { id: 'FAMILY', label: 'Family', emoji: '👨‍👩‍👧', desc: 'Household shared expenses' },
  { id: 'OFFICE', label: 'Office', emoji: '💼', desc: 'Work lunches & team events' },
  { id: 'ROOMMATES', label: 'Roommates', emoji: '🏠', desc: 'Flat rent, bills & wifi' },
  { id: 'STUDENTS', label: 'Students', emoji: '🎓', desc: 'Study projects & events' },
  { id: 'OTHER', label: 'Other', emoji: '📁', desc: 'General shared expenses' },
] as const;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<CreateGroupPayload['type']>('MESS');
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
      setError(err?.message || 'Failed to create group. Please check connection.');
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
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Feather name="users" size={20} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Create New Group</Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {error ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GROUP NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Uttara Mess, Sajek Tour, Room 402"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                maxLength={80}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GROUP TYPE</Text>
              <View style={styles.typeGrid}>
                {GROUP_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeCard,
                        isSelected && styles.typeCardSelected,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.typeEmoji}>{type.emoji}</Text>
                      <View style={styles.typeInfo}>
                        <Text
                          style={[
                            styles.typeLabel,
                            isSelected && styles.typeLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {type.label}
                        </Text>
                        <Text style={styles.typeDesc} numberOfLines={1}>
                          {type.desc}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.selectedCheck}>
                          <Feather name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Add rules, location, purpose or details..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <TouchableOpacity
              style={[styles.createBtn, isSubmitting && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="plus-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.createBtnText}>Create Group</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.md + 1,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm + 2,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  typeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs + 2,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeEmoji: {
    fontSize: 20,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  typeDesc: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sm + 1,
    fontWeight: '800',
  },
});
