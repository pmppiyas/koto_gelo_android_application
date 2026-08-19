import React, { useState } from 'react';
import {
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, TextInput } from '../ui/core';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  isPassword = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="gap-1.5 w-full" style={containerStyle as ViewStyle}>
      {label ? (
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center bg-card border rounded-xl px-3.5 h-12 transition-all ${
          error
            ? 'border-destructive bg-destructive/5'
            : isFocused
            ? 'border-primary shadow-sm'
            : 'border-border'
        }`}
      >
        <TextInput
          className="flex-1 text-sm text-foreground h-full"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor="#94A3B8"
          style={style as any}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            className="p-1"
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={isFocused ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text className="text-xs text-destructive font-medium">{error}</Text>
      ) : null}
    </View>
  );
};
