import React from 'react';
import { Image } from 'react-native';
import { View, Text } from '../ui/core';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'white';
  showSubtitle?: boolean;
  showIconOnly?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { px: 32, text: 'text-lg', sub: 'text-[10px]' },
  md: { px: 40, text: 'text-2xl', sub: 'text-xs' },
  lg: { px: 56, text: 'text-3xl', sub: 'text-xs' },
  xl: { px: 72, text: 'text-4xl', sub: 'text-sm' },
};

const LOGO_IMAGE = require('../../../assets/images/logo.png');

export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className,
}) => {
  return (
    <Image
      source={LOGO_IMAGE}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
      }}
      resizeMode="contain"
      className={className}
    />
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = false,
  showIconOnly = false,
  className,
}) => {
  const conf = sizeConfig[size] || sizeConfig.md;
  const isWhite = variant === 'white';
  const isLight = variant === 'light';

  return (
    <View className={`flex-row items-center gap-2.5 ${className || ''}`}>
      {/* Brand Icon Emblem from assets/images/logo.png */}
      <AppLogoIcon size={conf.px} />

      {/* Brand Text */}
      {!showIconOnly && (
        <View className="justify-center">
          <View className="flex-row items-baseline">
            <Text
              className={`font-black tracking-tight ${conf.text} ${
                isWhite
                  ? 'text-white'
                  : isLight
                  ? 'text-slate-100'
                  : 'text-slate-900'
              }`}
            >
              Koto<Text className="text-rose-500">Gelo</Text>
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
      )}
    </View>
  );
};

