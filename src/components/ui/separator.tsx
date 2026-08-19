import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { cn } from '../../lib/utils';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className,
  style,
  ...props
}) => {
  return (
    <View
      style={cn(
        'bg-slate-200',
        orientation === 'horizontal' ? 'h-[1px] w-full my-2' : 'w-[1px] h-full mx-2',
        className,
        style as ViewStyle
      )}
      {...props}
    />
  );
};
