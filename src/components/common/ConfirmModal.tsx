import React from 'react';
import { Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, Button } from '../ui';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  iconName?: keyof typeof Feather.glyphMap;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  iconName = 'trash-2',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const isPrimary = confirmVariant === 'primary';
  const isWarning = confirmVariant === 'warning';
  const isDanger = confirmVariant === 'danger';

  const iconColor = isPrimary ? '#2563EB' : isWarning ? '#D97706' : '#EF4444';
  const iconBg = isPrimary ? 'bg-blue-50' : isWarning ? 'bg-amber-50' : 'bg-red-50';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-950/60 justify-center items-center p-6">
        <View className="w-full max-w-sm bg-card rounded-3xl p-6 items-center shadow-xl border border-border">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${iconBg}`}>
            <Feather name={iconName} size={28} color={iconColor} />
          </View>

          <Text className="text-lg font-bold text-foreground text-center mb-1">{title}</Text>
          <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-6">{message}</Text>

          <View className="flex-row items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-full py-3"
              onPress={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>

            <Button
              variant={isDanger ? 'destructive' : isPrimary ? 'default' : 'secondary'}
              className="flex-1 rounded-full py-3"
              onPress={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
