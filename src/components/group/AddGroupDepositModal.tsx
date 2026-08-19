import React, { useState } from 'react';
import { Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Button,
} from '../ui';
import { GroupMember, groupService } from '../../services/groupService';

export interface AddGroupDepositModalProps {
  visible: boolean;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  {
    id: 'CASH',
    label: 'Cash',
    icon: 'dollar-sign',
    color: '#16A34A',
    bg: 'bg-emerald-50 border-emerald-500',
  },
  {
    id: 'BKASH',
    label: 'bKash',
    icon: 'smartphone',
    color: '#E11D48',
    bg: 'bg-rose-50 border-rose-500',
  },
  {
    id: 'NAGAD',
    label: 'Nagad',
    icon: 'zap',
    color: '#EA580C',
    bg: 'bg-amber-50 border-amber-500',
  },
  {
    id: 'ROCKET',
    label: 'Rocket',
    icon: 'send',
    color: '#8B5CF6',
    bg: 'bg-purple-50 border-purple-500',
  },
  {
    id: 'BANK',
    label: 'Bank',
    icon: 'credit-card',
    color: '#2563EB',
    bg: 'bg-blue-50 border-blue-500',
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: 'folder',
    color: '#6B7280',
    bg: 'bg-slate-100 border-slate-400',
  },
] as const;

export const AddGroupDepositModal: React.FC<AddGroupDepositModalProps> = ({
  visible,
  groupId,
  members,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] =
    useState<string>(currentUserId);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<
    'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER'
  >('CASH');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount');
      return;
    }
    if (!selectedMemberId) {
      setErrorMessage('Please select the member who deposited');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await groupService.addGroupDeposit({
        groupId,
        userId: selectedMemberId,
        amount: numAmount,
        method,
        note: note.trim() || undefined,
        depositDate: new Date().toISOString(),
      });
      setAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-950/60 justify-center items-center p-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full max-w-md"
        >
          <View className="bg-card rounded-3xl p-5 max-h-[90%] border border-border shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <Feather name="download" size={18} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-base font-bold text-foreground">
                    Record Fund Deposit
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    টাকা জমা / ফান্ড কালেকশন
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="p-1"
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View className="flex-row items-center gap-2 bg-rose-50 p-2.5 rounded-xl mt-3 border border-rose-200">
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text className="text-xs text-destructive font-medium flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} className="my-2">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 mt-2">
                WHO DEPOSITED? (কে টাকা দিল?)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 py-1 mb-3"
              >
                {members.map(m => {
                  const isSelected = selectedMemberId === m.userId;
                  const name = m.user.name || m.user.username;
                  const initial = name.charAt(0).toUpperCase();
                  const isYou = m.userId === currentUserId;

                  return (
                    <TouchableOpacity
                      key={m.userId}
                      className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? 'bg-primary-light border-primary'
                          : 'bg-background border-border'
                      }`}
                      onPress={() => setSelectedMemberId(m.userId)}
                      activeOpacity={0.7}
                    >
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center ${
                          isSelected ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          }`}
                        >
                          {initial}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }`}
                        numberOfLines={1}
                      >
                        {isYou ? 'You' : name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                DEPOSIT AMOUNT (টাকার পরিমাণ) *
              </Text>
              <View className="flex-row items-center bg-background border-2 border-border rounded-xl px-4 h-13 mb-3">
                <Text className="text-2xl font-extrabold text-emerald-600 mr-2">
                  ৳
                </Text>
                <TextInput
                  className="flex-1 text-xl font-extrabold text-foreground h-full"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                PAYMENT METHOD (পদ্ধতি)
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {PAYMENT_METHODS.map(m => {
                  const isSelected = method === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      className={`flex-row items-center gap-1.5 w-[31%] py-2.5 px-2 rounded-xl border justify-center ${
                        isSelected
                          ? `${m.bg} border`
                          : 'bg-background border-border'
                      }`}
                      onPress={() => setMethod(m.id)}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name={m.icon as any}
                        size={14}
                        color={isSelected ? m.color : '#64748B'}
                      />
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold'
                            : 'text-muted-foreground font-medium'
                        }`}
                        style={{ color: isSelected ? m.color : undefined }}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                NOTE / REFERENCE (ঐচ্ছিক)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground mb-2"
                placeholder="e.g. August Meal Advance, Trip Advance"
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                maxLength={150}
              />
            </ScrollView>

            <View className="flex-row items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-2.5"
                onPress={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1 rounded-xl py-2.5"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                Save Deposit
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
