import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from '../ui/core';

export interface CategorySlice {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  emoji?: string;
}

export interface DonutChartProps {
  data: CategorySlice[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  animProgress?: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data = [],
  total = 0,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View className="w-full py-1">
      {/* Clean, Borderless Proportional Multi-Color Spectrum Bar */}
      {data.length > 0 && total > 0 && (
        <View className="w-full">
          <View className="flex-row h-2.5 rounded-full overflow-hidden bg-slate-100">
            {data.map((cat, idx) => {
              const isSelected =
                !selectedCategory || selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={idx}
                  style={{
                    width: `${Math.max(cat.percentage, 3)}%`,
                    backgroundColor: isSelected
                      ? cat.color
                      : `${cat.color}35`,
                  }}
                  onPress={() =>
                    onSelectCategory(
                      selectedCategory === cat.name ? null : cat.name,
                    )
                  }
                  activeOpacity={0.8}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
