import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { View, Text, TouchableOpacity } from '../ui/core';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary border border-primary shadow-sm',
  secondary: 'bg-emerald-600 border border-emerald-600 shadow-sm',
  outline: 'bg-background border border-border',
  ghost: 'bg-transparent border-0',
  danger: 'bg-destructive border border-destructive shadow-sm',
};

const textVariantStyles: Record<string, string> = {
  primary: 'text-primary-foreground font-bold',
  secondary: 'text-white font-bold',
  outline: 'text-foreground font-semibold',
  ghost: 'text-foreground font-semibold',
  danger: 'text-destructive-foreground font-bold',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3.5 rounded-2xl',
};

const textSizeStyles: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center gap-2 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${disabled || loading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={style as ViewStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost' ? '#2563EB' : '#FFFFFF'
          }
        />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text
            className={`text-center ${textVariantStyles[variant]} ${textSizeStyles[size]}`}
            style={textStyle as TextStyle}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
