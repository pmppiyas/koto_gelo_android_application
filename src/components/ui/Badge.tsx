import React from 'react';
import { View, Text, ViewProps, TextStyle, ViewStyle } from 'react-native';
import { cn } from '../../lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const badgeVariants: Record<string, { bg: string; text: string; border: string }> = {
  default: { bg: 'bg-primary', text: 'text-white font-bold', border: 'border-primary' },
  secondary: { bg: 'bg-slate-100', text: 'text-slate-700 font-semibold', border: 'border-slate-200' },
  destructive: { bg: 'bg-rose-50', text: 'text-rose-700 font-bold', border: 'border-rose-200' },
  outline: { bg: 'bg-transparent', text: 'text-slate-700 font-medium', border: 'border-slate-300' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700 font-bold', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700 font-bold', border: 'border-amber-200' },
  info: { bg: 'bg-indigo-50', text: 'text-indigo-700 font-bold', border: 'border-indigo-200' },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  textClassName,
  style,
  ...props
}) => {
  const v = badgeVariants[variant] || badgeVariants.default;

  return (
    <View
      style={cn(
        'flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border',
        v.bg,
        v.border,
        className,
        style as ViewStyle
      )}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={cn('text-xs', v.text, textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
