import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, Easing } from 'react-native';
import { View, Text } from '../ui/core';
import { AppLogoIcon } from '@/components/common/Logo';

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
  subtitle = 'Securing your financial records...',
  fullscreen = true,
  isOverlay = false,
}) => {
  const displayMessage = text || message || 'Loading KotoGelo...';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),

        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View
      className={`items-center justify-center p-6 ${
        isOverlay
          ? 'absolute inset-0 z-50 bg-slate-900/70'
          : fullscreen
          ? 'flex-1 bg-slate-50'
          : ''
      }`}
      style={
        isOverlay
          ? ({
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            } as any)
          : undefined
      }
    >
      {/* Modern Premium Card */}
      <View className="bg-white px-8 py-12 rounded-[40px] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] items-center max-w-[340px] w-full">
        {/* Animated Logo Container */}
        <View className="relative items-center justify-center mb-8 mt-2">
          {/* Animated Glow Behind Logo */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              backgroundColor: '#EEF2FF',
              borderRadius: 65,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
              backfaceVisibility: 'hidden',
            }}
          />

          {/* Main Logo Container */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              zIndex: 10,
              backfaceVisibility: 'hidden',
            }}
          >
            <View className="bg-white p-5 rounded-full shadow-sm border border-slate-50 ">
              <AppLogoIcon size={60} />
            </View>
          </Animated.View>
        </View>

        {/* Dynamic Status Message */}
        <Text className="text-[24px] font-extrabold text-slate-900 text-center mb-2 tracking-tight">
          {displayMessage}
        </Text>

        {/* Subtitle */}
        {!!subtitle && (
          <Text className="text-[13px] font-medium text-slate-500 text-center leading-relaxed mb-8 px-2">
            {subtitle}
          </Text>
        )}

        {/* Sleek Minimalist Processing Indicator */}
        <View className="flex-row items-center justify-center gap-3 mt-2">
          <ActivityIndicator size="small" color="#4F46E5" />
          <Animated.View
            style={{ opacity: opacityAnim, backfaceVisibility: 'hidden' }}
          >
            <Text className="text-[12px] font-extrabold text-indigo-600 uppercase tracking-[0.25em]">
              Processing
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};
