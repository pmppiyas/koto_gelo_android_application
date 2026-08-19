import React from 'react';
import { View, Text, ViewProps, TextProps, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../lib/utils';

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card: React.FC<CardProps> = ({ className, style, children, ...props }) => {
  return (
    <View
      style={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm p-4',
        className,
        style as ViewStyle
      )}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className, style, children, ...props }) => {
  return (
    <View
      style={cn('flex-col gap-1 pb-3', className, style as ViewStyle)}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardTitle: React.FC<TextProps & { className?: string }> = ({
  className,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={cn('text-lg font-bold text-slate-900', className, style as TextStyle)}
      {...props}
    >
      {children}
    </Text>
  );
};

export const CardDescription: React.FC<TextProps & { className?: string }> = ({
  className,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={cn('text-xs text-slate-500 font-normal', className, style as TextStyle)}
      {...props}
    >
      {children}
    </Text>
  );
};

export const CardContent: React.FC<CardProps> = ({ className, style, children, ...props }) => {
  return (
    <View style={cn('flex-col gap-2', className, style as ViewStyle)} {...props}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className, style, children, ...props }) => {
  return (
    <View
      style={cn(
        'flex-row items-center justify-between pt-3 mt-2 border-t border-slate-100',
        className,
        style as ViewStyle
      )}
      {...props}
    >
      {children}
    </View>
  );
};
