import React from 'react';
import { View, Text, Image, ViewProps, TextStyle, ViewStyle, ImageSourcePropType } from 'react-native';
import { cn } from '../../lib/utils';

export interface AvatarProps extends ViewProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  sm: { container: 'w-7 h-7 rounded-full', text: 'text-xs font-bold' },
  md: { container: 'w-10 h-10 rounded-full', text: 'text-sm font-bold' },
  lg: { container: 'w-12 h-12 rounded-full', text: 'text-base font-bold' },
  xl: { container: 'w-16 h-16 rounded-full', text: 'text-xl font-bold' },
};

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  className,
  style,
  children,
  ...props
}) => {
  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <View
      style={cn(
        'items-center justify-center bg-blue-100 border border-blue-200 overflow-hidden',
        s.container,
        className,
        style as ViewStyle
      )}
      {...props}
    >
      {children}
    </View>
  );
};

export const AvatarImage: React.FC<{ source: ImageSourcePropType; className?: string }> = ({
  source,
  className,
}) => {
  return (
    <Image
      source={source}
      style={cn('w-full h-full rounded-full', className)}
      resizeMode="cover"
    />
  );
};

export const AvatarFallback: React.FC<{ children: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; textClassName?: string }> = ({
  children,
  size = 'md',
  className,
  textClassName,
}) => {
  const s = sizeClasses[size] || sizeClasses.md;
  return (
    <Text style={cn('text-blue-600 font-extrabold', s.text, textClassName)}>
      {children.slice(0, 2).toUpperCase()}
    </Text>
  );
};
