import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { cn } from '../../lib/utils';

export interface ButtonProps extends TouchableOpacityProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-primary border border-primary shadow-sm',
  destructive: 'bg-destructive border border-destructive shadow-sm',
  outline: 'bg-card border border-border shadow-xs',
  secondary: 'bg-slate-100 border border-slate-200',
  ghost: 'bg-transparent border-0 shadow-none',
  link: 'bg-transparent border-0 shadow-none',
  success: 'bg-emerald-600 border border-emerald-600 shadow-sm',
};

const textVariantStyles: Record<string, string> = {
  default: 'text-white font-bold',
  destructive: 'text-white font-bold',
  outline: 'text-foreground font-semibold',
  secondary: 'text-foreground font-semibold',
  ghost: 'text-muted-foreground font-medium',
  link: 'text-primary font-semibold',
  success: 'text-white font-bold',
};

const sizeStyles: Record<string, string> = {
  default: 'px-4 py-3 rounded-xl',
  sm: 'px-3 py-1.5 rounded-lg',
  lg: 'px-6 py-4 rounded-2xl',
  icon: 'w-10 h-10 rounded-xl items-center justify-center p-0',
};

const textSizeStyles: Record<string, string> = {
  default: 'text-sm',
  sm: 'text-xs',
  lg: 'text-base',
  icon: 'text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  children,
  isLoading = false,
  disabled = false,
  className,
  textClassName,
  style,
  ...props
}) => {
  const containerStyle = cn(
    'flex-row items-center justify-center gap-2',
    variantStyles[variant],
    sizeStyles[size],
    (disabled || isLoading) && 'opacity-50',
    className,
    style as ViewStyle,
  );

  const textStyle = cn(
    'text-center',
    textVariantStyles[variant],
    textSizeStyles[size],
    textClassName,
  );

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || isLoading}
      style={containerStyle}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' ||
            variant === 'ghost' ||
            variant === 'secondary'
              ? '#4F46E5'
              : '#FFFFFF'
          }
        />
      ) : typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};
