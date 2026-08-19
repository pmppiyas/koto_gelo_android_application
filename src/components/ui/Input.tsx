import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '../../lib/utils';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName,
  className,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={cn('flex-col gap-1.5 w-full', containerClassName)}>
      {label ? (
        <Text style={cn('text-xs font-bold text-slate-700 uppercase tracking-wider')}>
          {label}
        </Text>
      ) : null}

      <View
        style={cn(
          'flex-row items-center px-3.5 bg-white border rounded-xl h-11 transition-all',
          error
            ? 'border-red-500 bg-red-50'
            : isFocused
            ? 'border-blue-600 shadow-sm'
            : 'border-slate-300',
          className,
          style as ViewStyle
        )}
      >
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={16}
            color={error ? '#EF4444' : isFocused ? '#2563EB' : '#94A3B8'}
            style={{ marginRight: 8 }}
          />
        ) : null}

        <TextInput
          style={cn('flex-1 text-sm text-slate-900 font-normal h-full')}
          placeholderTextColor="#94A3B8"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={0.7}
          >
            <Feather
              name={rightIcon}
              size={16}
              color={error ? '#EF4444' : '#94A3B8'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={cn('text-xs text-red-600 font-medium')}>{error}</Text>
      ) : helperText ? (
        <Text style={cn('text-xs text-slate-500 font-normal')}>{helperText}</Text>
      ) : null}
    </View>
  );
};
