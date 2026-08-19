import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '../../lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
        <View style={cn('flex-1 bg-slate-950/60 items-center justify-center p-4')}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={cn('w-full max-w-md')}
          >
            <TouchableWithoutFeedback>
              <View>{children}</View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string; style?: ViewStyle }> = ({
  children,
  className,
  style,
}) => {
  return (
    <View
      style={cn(
        'bg-white rounded-2xl p-5 border border-slate-200 shadow-xl flex-col gap-4',
        className,
        style
      )}
    >
      {children}
    </View>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string; style?: ViewStyle }> = ({
  children,
  className,
  style,
}) => {
  return (
    <View style={cn('flex-col gap-1 pb-2 border-b border-slate-100', className, style)}>
      {children}
    </View>
  );
};

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string; style?: TextStyle }> = ({
  children,
  className,
  style,
}) => {
  return (
    <Text style={cn('text-lg font-bold text-slate-900', className, style)}>
      {children}
    </Text>
  );
};

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string; style?: TextStyle }> = ({
  children,
  className,
  style,
}) => {
  return (
    <Text style={cn('text-xs text-slate-500 font-normal leading-relaxed', className, style)}>
      {children}
    </Text>
  );
};

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string; style?: ViewStyle }> = ({
  children,
  className,
  style,
}) => {
  return (
    <View
      style={cn(
        'flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2',
        className,
        style
      )}
    >
      {children}
    </View>
  );
};
