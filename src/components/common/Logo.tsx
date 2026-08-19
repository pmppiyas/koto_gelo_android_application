import React from 'react';
import { View, Text } from '../ui/core';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'white';
  showSubtitle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'w-8 h-8 rounded-xl', symbol: 'text-base', text: 'text-lg', sub: 'text-[10px]' },
  md: { icon: 'w-10 h-10 rounded-2xl', symbol: 'text-xl', text: 'text-2xl', sub: 'text-xs' },
  lg: { icon: 'w-14 h-14 rounded-3xl', symbol: 'text-3xl', text: 'text-3xl', sub: 'text-xs' },
  xl: { icon: 'w-18 h-18 rounded-3xl', symbol: 'text-4xl', text: 'text-4xl', sub: 'text-sm' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = false,
  className,
}) => {
  const conf = sizeConfig[size] || sizeConfig.md;
  const isWhite = variant === 'white';
  const isLight = variant === 'light';

  return (
    <View className={`flex-row items-center gap-2.5 ${className || ''}`}>
      {/* Brand Icon Emblem */}
      <View
        className={`${conf.icon} items-center justify-center ${
          isWhite
            ? 'bg-white shadow-md'
            : 'bg-primary shadow-md border border-indigo-400/30'
        }`}
      >
        <Text
          className={`font-black ${conf.symbol} ${
            isWhite ? 'text-primary' : 'text-white'
          }`}
          style={{ includeFontPadding: false }}
        >
          ৳
        </Text>
      </View>

      {/* Brand Text */}
      <View className="justify-center">
        <View className="flex-row items-baseline">
          <Text
            className={`font-black tracking-tight ${conf.text} ${
              isWhite ? 'text-white' : isLight ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Koto<Text className="text-primary">Gelo</Text>
          </Text>
        </View>
        {showSubtitle && (
          <Text
            className={`font-medium ${conf.sub} ${
              isWhite ? 'text-white/80' : 'text-slate-500'
            }`}
          >
            Smart Expense & Mess Tracker
          </Text>
        )}
      </View>
    </View>
  );
};
