import React, { forwardRef } from 'react';
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  ViewProps as RNViewProps,
  TextProps as RNTextProps,
  TouchableOpacityProps as RNTouchableOpacityProps,
  ScrollViewProps as RNScrollViewProps,
  TextInputProps as RNTextInputProps,
  PressableProps as RNPressableProps,
  KeyboardAvoidingViewProps as RNKeyboardAvoidingViewProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  SafeAreaView as RNSafeAreaView,
  NativeSafeAreaViewProps,
} from 'react-native-safe-area-context';
import { cn } from '../../lib/utils';

export interface StyledViewProps extends RNViewProps {
  className?: string;
}

export interface StyledSafeAreaViewProps extends NativeSafeAreaViewProps {
  className?: string;
}

export interface StyledTextProps extends RNTextProps {
  className?: string;
}

export interface StyledTouchableOpacityProps extends RNTouchableOpacityProps {
  className?: string;
}

export interface StyledScrollViewProps extends RNScrollViewProps {
  className?: string;
  contentContainerClassName?: string;
}

export interface StyledTextInputProps extends RNTextInputProps {
  className?: string;
}

export interface StyledKeyboardAvoidingViewProps extends RNKeyboardAvoidingViewProps {
  className?: string;
}

export const View = forwardRef<RNView, StyledViewProps>(({ className, style, ...props }, ref) => {
  return <RNView ref={ref} style={cn(className, style as ViewStyle)} {...props} />;
});
View.displayName = 'View';

export const Text = forwardRef<RNText, StyledTextProps>(({ className, style, ...props }, ref) => {
  return <RNText ref={ref} style={cn(className, style as TextStyle)} {...props} />;
});
Text.displayName = 'Text';

export const TouchableOpacity = forwardRef<RNView, StyledTouchableOpacityProps>(
  ({ className, style, activeOpacity = 0.7, ...props }, ref) => {
    return (
      <RNTouchableOpacity
        ref={ref}
        activeOpacity={activeOpacity}
        style={cn(className, style as ViewStyle)}
        {...props}
      />
    );
  }
);
TouchableOpacity.displayName = 'TouchableOpacity';

export const ScrollView = forwardRef<RNScrollView, StyledScrollViewProps>(
  ({ className, contentContainerClassName, style, contentContainerStyle, ...props }, ref) => {
    return (
      <RNScrollView
        ref={ref}
        style={cn(className, style as ViewStyle)}
        contentContainerStyle={cn(contentContainerClassName, contentContainerStyle as ViewStyle)}
        {...props}
      />
    );
  }
);
ScrollView.displayName = 'ScrollView';

export const SafeAreaView = forwardRef<RNView, StyledSafeAreaViewProps>(
  ({ className, style, ...props }, ref) => {
    return <RNSafeAreaView ref={ref as any} style={cn(className, style as ViewStyle)} {...props} />;
  }
);
SafeAreaView.displayName = 'SafeAreaView';

export const TextInput = forwardRef<RNTextInput, StyledTextInputProps>(
  ({ className, style, ...props }, ref) => {
    return <RNTextInput ref={ref} style={cn(className, style as TextStyle)} {...props} />;
  }
);
TextInput.displayName = 'TextInput';

export const Pressable = forwardRef<RNView, StyledViewProps & RNPressableProps>(
  ({ className, style, ...props }, ref) => {
    return <RNPressable ref={ref} style={cn(className, style as ViewStyle)} {...props} />;
  }
);
Pressable.displayName = 'Pressable';

export const KeyboardAvoidingView = forwardRef<RNView, StyledKeyboardAvoidingViewProps>(
  ({ className, style, ...props }, ref) => {
    return <RNKeyboardAvoidingView ref={ref as any} style={cn(className, style as ViewStyle)} {...props} />;
  }
);
KeyboardAvoidingView.displayName = 'KeyboardAvoidingView';

export const div = View;
export const p = Text;
export const span = Text;
export const button = TouchableOpacity;
