import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform } from 'react-native';
import { View, Text } from '../ui/core';

export interface LoadingProps {
  message?: string;
  text?: string;
  subtitle?: string;
  fullscreen?: boolean;
  isOverlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  text,
  subtitle = 'Securing your financial records & balances',
  fullscreen = true,
  isOverlay = false,
}) => {
  const displayMessage = text || message || 'Loading KotoGelo...';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View
      className={`items-center justify-center p-6 ${
        isOverlay
          ? 'absolute inset-0 z-50 bg-slate-900/60'
          : fullscreen
          ? 'flex-1 bg-background'
          : ''
      }`}
      style={
        isOverlay
          ? ({
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            } as any)
          : undefined
      }
    >
      <View className="bg-card px-8 py-7 rounded-3xl border border-border/80 shadow-2xl items-center max-w-[320px] w-full">
        {/* Pulsating Logo Emblem */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
          className="mb-4"
        >
          <View className="w-16 h-16 rounded-3xl bg-primary items-center justify-center shadow-lg border-2 border-indigo-400/40">
            <Text
              className="text-3xl font-black text-white"
              style={{ includeFontPadding: false }}
            >
              ৳
            </Text>
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Text className="text-xl font-black tracking-tight text-foreground mb-1">
          Koto<Text className="text-primary">Gelo</Text>
        </Text>

        {/* Dynamic Status Message */}
        <Text className="text-sm font-bold text-slate-800 text-center mb-1">
          {displayMessage}
        </Text>

        {/* Subtitle */}
        {!!subtitle && (
          <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
            {subtitle}
          </Text>
        )}

        {/* Activity Indicator Spinner */}
        <View className="flex-row items-center gap-2 bg-primary-light px-3.5 py-1.5 rounded-full border border-indigo-200">
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text className="text-[11px] font-bold text-primary">Please wait</Text>
        </View>
      </View>
    </View>
  );
};
