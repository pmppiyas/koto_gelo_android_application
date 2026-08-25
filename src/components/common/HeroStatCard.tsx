import React from 'react';
import { View, Text, TouchableOpacity } from '../ui/core';

export interface HeroStatMetric {
  label: string;
  value: string | number;
  valueColor?: string;
  onPress?: () => void;
}

export interface HeroStatCardProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  dotColor?: string;
  mainAmount: string | number;
  mainAmountPrefix?: string;
  mainAmountColor?: string;
  subtitle?: string;
  metrics?: HeroStatMetric[];
  className?: string;
}

export const HeroStatCard: React.FC<HeroStatCardProps> = ({
  title,
  badge,
  badgeColor = 'bg-indigo-500/20 border-indigo-400/30',
  badgeTextColor = 'text-indigo-300',
  dotColor = 'bg-emerald-400',
  mainAmount,
  mainAmountPrefix = '৳',
  mainAmountColor = 'text-white',
  subtitle,
  metrics = [],
  className = '',
}) => {
  const formattedMainAmount =
    typeof mainAmount === 'number'
      ? mainAmount.toLocaleString('en-US')
      : mainAmount;

  return (
    <View
      className={`bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800 ${className}`}
    >
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${dotColor}`} />
          <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {title}
          </Text>
        </View>

        {badge ? (
          <View
            className={`px-2.5 py-0.5 rounded-full border ${badgeColor}`}
          >
            <Text className={`text-[10px] font-bold ${badgeTextColor}`}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main Amount */}
      <Text className={`text-3xl font-black mt-1.5 ${mainAmountColor}`}>
        {mainAmountPrefix}
        {formattedMainAmount}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text className="text-[11px] text-slate-400 mt-1">{subtitle}</Text>
      ) : null}

      {/* Divider & Bottom Metrics Bar */}
      {metrics && metrics.length > 0 && (
        <>
          <View className="h-[1px] bg-slate-800/90 my-3.5" />
          <View className="flex-row justify-between items-center">
            {metrics.map((metric, index) => {
              const formattedValue =
                typeof metric.value === 'number'
                  ? metric.value.toLocaleString('en-US')
                  : metric.value;

              const Wrapper = metric.onPress ? TouchableOpacity : View;

              return (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <View className="w-[1px] h-7 bg-slate-800 mx-1.5" />
                  )}
                  <Wrapper
                    onPress={metric.onPress}
                    activeOpacity={metric.onPress ? 0.7 : 1}
                    className="flex-1 items-center justify-center"
                  >
                    <Text
                      className="text-[10px] font-semibold text-slate-400 mb-0.5 text-center"
                      numberOfLines={1}
                    >
                      {metric.label}
                    </Text>
                    <Text
                      className={`text-sm font-black text-center ${
                        metric.valueColor || 'text-slate-100'
                      }`}
                      numberOfLines={1}
                    >
                      {formattedValue}
                    </Text>
                  </Wrapper>
                </React.Fragment>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};
