import React, { useState, useEffect } from 'react';
import { Modal, Platform, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Button,
} from '../ui';
import { GroupMember, groupService } from '../../services/groupService';
import { SuccessModal } from '../common/SuccessModal';

export interface AddGroupDepositModalProps {
  visible: boolean;
  groupId: string;
  members: GroupMember[];
  currentUserId?: string;
  onClose: () => void;
  onSuccess: (newDepositId?: string) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'CASH',
    label: 'Cash',
    icon: 'dollar-sign',
    color: '#059669',
    bg: 'bg-emerald-50 border-emerald-500',
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-500',
  },
  {
    id: 'BKASH',
    label: 'bKash',
    icon: 'smartphone',
    color: '#E11D48',
    bg: 'bg-rose-50 border-rose-500',
    activeBg: 'bg-rose-50',
    activeBorder: 'border-rose-500',
  },
  {
    id: 'NAGAD',
    label: 'Nagad',
    icon: 'zap',
    color: '#EA580C',
    bg: 'bg-amber-50 border-amber-500',
    activeBg: 'bg-amber-50',
    activeBorder: 'border-amber-500',
  },
  {
    id: 'ROCKET',
    label: 'Rocket',
    icon: 'send',
    color: '#8B5CF6',
    bg: 'bg-purple-50 border-purple-500',
    activeBg: 'bg-purple-50',
    activeBorder: 'border-purple-500',
  },
  {
    id: 'BANK',
    label: 'Bank',
    icon: 'credit-card',
    color: '#2563EB',
    bg: 'bg-blue-50 border-blue-500',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-500',
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: 'folder',
    color: '#64748B',
    bg: 'bg-slate-100 border-slate-400',
    activeBg: 'bg-slate-100',
    activeBorder: 'border-slate-400',
  },
] as const;

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export const AddGroupDepositModal: React.FC<AddGroupDepositModalProps> = ({
  visible,
  groupId,
  members = [],
  currentUserId = '',
  onClose,
  onSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<
    'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER'
  >('CASH');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number>(0);
  const [newlyCreatedDepositId, setNewlyCreatedDepositId] = useState<string | null>(null);

  const currentMember = members.find(
    (m) =>
      m.userId === currentUserId ||
      (m.user as any)?.id === currentUserId ||
      (m as any).id === currentUserId,
  );
  const isCurrentUserAdmin =
    (currentMember?.role === 'OWNER' ||
      currentMember?.role === 'ADMIN' ||
      (currentMember as any)?.role === 'OWNER' ||
      (currentMember as any)?.role === 'ADMIN') ??
    false;

  // Synchronize default selected member when modal opens
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (currentUserId) {
        setSelectedMemberId(currentUserId);
      } else if (members.length > 0) {
        const first = members[0];
        setSelectedMemberId(first.userId || (first.user as any)?.id || (first as any).id || '');
      }
    }
  }, [visible, currentUserId, members]);

  const handleQuickAdd = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addVal));
  };

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
      const selectedMember = members.find(
        (m) =>
          m.userId === selectedMemberId ||
          (m.user as any)?.id === selectedMemberId ||
          (m as any).id === selectedMemberId,
      );

      const userObj = selectedMember?.user || (selectedMember ? {
        id: selectedMember.userId || (selectedMember as any).id,
        username: (selectedMember as any).username || selectedMember.user?.username || 'Member',
        name: (selectedMember as any).name || selectedMember.user?.name || null,
        avatarUrl: (selectedMember as any).avatarUrl || selectedMember.user?.avatarUrl || null,
      } : undefined);

      const created = await groupService.addGroupDeposit({
        groupId,
        userId: selectedMemberId,
        amount: numAmount,
        method,
        note: note.trim() || undefined,
        depositDate: new Date().toISOString(),
        user: userObj,
      });
      if (created && (created.id || (created as any)._id)) {
        setNewlyCreatedDepositId(created.id || (created as any)._id);
      }
      setSuccessAmount(numAmount);
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal
        visible={true}
        title="Deposit Recorded!"
        subtitle="Added to group fund successfully"
        amount={successAmount}
        amountPrefix="+"
        type="DEPOSIT"
        autoDismissMs={2500}
        onDismiss={() => {
          const createdId = newlyCreatedDepositId;
          setShowSuccess(false);
          setNewlyCreatedDepositId(null);
          setAmount('');
          setNote('');
          onSuccess(createdId || undefined);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-950/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <View className="w-full bg-card rounded-t-3xl p-5 max-h-[90%] border-t border-border shadow-2xl">
            {/* Drag Handle Indicator */}
            <View className="w-12 h-1 bg-muted-foreground/30 rounded-full self-center mb-3" />

            {/* Header */}
            <View className="flex-row items-center justify-between pb-3.5 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center shadow-2xs">
                  <Feather name="download" size={20} color="#059669" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    Add Group Deposit
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Record member advances & group contributions
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-muted/70 items-center justify-center"
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View className="flex-row items-center gap-2 bg-rose-50 p-3 rounded-xl mt-3 border border-rose-200">
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text className="text-xs text-destructive font-semibold flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} className="my-3">
              {/* Member Selection (Only visible for Admins / Owners) */}
              {isCurrentUserAdmin && members.length > 0 && (
                <>
                  <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                    WHO DEPOSITED? *
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-1 mb-3"
                  >
                    {members.map((m, idx) => {
                      const mId =
                        m.userId ||
                        (m.user as any)?.id ||
                        (m as any).id ||
                        `m_${idx}`;
                      const isSelected = selectedMemberId === mId;
                      const name =
                        m.user?.name ||
                        m.user?.username ||
                        (m as any).name ||
                        (m as any).username ||
                        'Member';
                      const username =
                        m.user?.username || (m as any).username;
                      const initial = (username || name).charAt(0).toUpperCase();
                      const isYou = currentUserId ? mId === currentUserId : false;

                      return (
                        <TouchableOpacity
                          key={mId}
                          className={`flex-row items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                              : 'bg-muted/40 border-border/80 active:bg-muted'
                          }`}
                          onPress={() => setSelectedMemberId(mId)}
                          activeOpacity={0.7}
                        >
                          <View
                            className={`w-6 h-6 rounded-full items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-600'
                                : 'bg-muted border border-border'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black ${
                                isSelected ? 'text-white' : 'text-muted-foreground'
                              }`}
                            >
                              {initial}
                            </Text>
                          </View>
                          <Text
                            className={`text-xs ${
                              isSelected
                                ? 'text-emerald-800 font-extrabold'
                                : 'text-foreground font-semibold'
                            }`}
                            numberOfLines={1}
                          >
                            {isYou ? 'You' : username ? `@${username}` : name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Deposit Amount Input */}
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">
                DEPOSIT AMOUNT *
              </Text>
              <View className="flex-row items-center bg-background border-2 border-emerald-500/50 rounded-2xl px-4 h-14 mb-2 shadow-2xs">
                <Text className="text-2xl font-black text-emerald-600 mr-2">
                  ৳
                </Text>
                <TextInput
                  className="flex-1 text-2xl font-black text-foreground h-full"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={false}
                />
                {amount ? (
                  <TouchableOpacity onPress={() => setAmount('')} className="p-1">
                    <Feather name="x" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Quick Amount Chips */}
              <View className="flex-row gap-2 mb-4">
                {QUICK_AMOUNTS.map((amtVal) => (
                  <TouchableOpacity
                    key={amtVal}
                    onPress={() => handleQuickAdd(amtVal)}
                    className="flex-1 items-center py-2 bg-emerald-50/80 border border-emerald-200/90 rounded-xl active:bg-emerald-100 shadow-2xs"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-extrabold text-emerald-700">
                      +৳{amtVal >= 1000 ? `${amtVal / 1000}k` : amtVal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Method 2-Row 3-Column Equal Grid */}
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                PAYMENT METHOD
              </Text>
              <View className="gap-2 mb-4">
                {/* Row 1: Cash, bKash, Nagad */}
                <View className="flex-row gap-2">
                  {PAYMENT_METHODS.slice(0, 3).map((m) => {
                    const isSelected = method === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                          isSelected
                            ? `${m.activeBg} ${m.activeBorder} border-2 shadow-2xs`
                            : 'bg-background border-border active:bg-muted/50'
                        }`}
                        onPress={() => setMethod(m.id)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={m.icon as any}
                          size={15}
                          color={isSelected ? m.color : '#64748B'}
                        />
                        <Text
                          className={`text-xs ${
                            isSelected
                              ? 'font-extrabold'
                              : 'text-muted-foreground font-semibold'
                          }`}
                          style={{ color: isSelected ? m.color : undefined }}
                          numberOfLines={1}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Row 2: Rocket, Bank, Other */}
                <View className="flex-row gap-2">
                  {PAYMENT_METHODS.slice(3, 6).map((m) => {
                    const isSelected = method === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                          isSelected
                            ? `${m.activeBg} ${m.activeBorder} border-2 shadow-2xs`
                            : 'bg-background border-border active:bg-muted/50'
                        }`}
                        onPress={() => setMethod(m.id)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={m.icon as any}
                          size={15}
                          color={isSelected ? m.color : '#64748B'}
                        />
                        <Text
                          className={`text-xs ${
                            isSelected
                              ? 'font-extrabold'
                              : 'text-muted-foreground font-semibold'
                          }`}
                          style={{ color: isSelected ? m.color : undefined }}
                          numberOfLines={1}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Note Input */}
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">
                NOTE / REFERENCE (OPTIONAL)
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-xs text-foreground mb-2 shadow-2xs"
                placeholder="e.g. August meal advance, Tour advance"
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                maxLength={150}
              />
            </ScrollView>

            {/* Bottom Actions */}
            <View className="flex-row items-center gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl py-3.5 border-border"
                onPress={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 shadow-md ${
                  isSubmitting ? 'opacity-70' : 'active:bg-emerald-700'
                }`}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Feather name="check" size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-sm font-bold text-white">
                  {isSubmitting ? 'Saving...' : 'Save Deposit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
