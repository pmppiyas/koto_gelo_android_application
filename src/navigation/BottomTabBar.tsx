import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from '../components/ui/core';
import { ROUTES } from '../constants/routes';

export interface BottomTabBarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onOpenDrawer: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeRoute,
  onNavigate,
  onOpenDrawer,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 6 : 8);

  const renderTab = (route: string, icon: keyof typeof Feather.glyphMap, label: string) => {
    const isActive = activeRoute === route;

    return (
      <TouchableOpacity
        key={route}
        className="flex-1 items-center justify-center py-1"
        onPress={() => onNavigate(route)}
        activeOpacity={0.7}
      >
        <View
          className={`h-7 px-3 rounded-full items-center justify-center transition-all ${
            isActive ? 'bg-primary-light border border-indigo-100' : 'bg-transparent'
          }`}
        >
          <Feather
            name={icon}
            size={19}
            color={isActive ? '#4F46E5' : '#64748B'}
          />
        </View>
        <Text
          className={`text-[10.5px] mt-0.5 tracking-tight ${
            isActive ? 'text-primary font-bold' : 'text-muted-foreground font-semibold'
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="flex-row bg-card border-t border-border items-center justify-between px-2 pt-1.5 shadow-sm"
      style={{
        paddingBottom: bottomPadding,
        elevation: 8,
      }}
    >
      {/* 1. Home Tab */}
      {renderTab(ROUTES.HOME, 'home', 'Home')}

      {/* 2. Expenses Tab */}
      {renderTab(ROUTES.TRANSACTIONS, 'credit-card', 'Expenses')}

      {/* 3. Center Elevated Floating "+ Add" Button */}
      <TouchableOpacity
        className="flex-1 items-center justify-center -mt-3.5"
        onPress={() => onNavigate(ROUTES.ADD_EXPENSE)}
        activeOpacity={0.85}
      >
        <View
          className="w-12 h-12 rounded-full bg-primary items-center justify-center border-3 border-card"
          style={{
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 7,
          }}
        >
          <Feather name="plus" size={24} color="#FFFFFF" strokeWidth={2.6} />
        </View>
        <Text className="text-[10px] font-bold text-primary mt-0.5 tracking-tight">
          Add
        </Text>
      </TouchableOpacity>

      {/* 4. Analytics Tab */}
      {renderTab(ROUTES.EXPENSE_ANALYTICS, 'pie-chart', 'Analytics')}

      {/* 5. Menu Drawer Trigger */}
      <TouchableOpacity
        className="flex-1 items-center justify-center py-1"
        onPress={onOpenDrawer}
        activeOpacity={0.7}
      >
        <View
          className={`h-7 px-3 rounded-full items-center justify-center transition-all ${
            activeRoute === 'MENU' ? 'bg-primary-light border border-indigo-100' : 'bg-transparent'
          }`}
        >
          <Feather
            name="menu"
            size={19}
            color={activeRoute === 'MENU' ? '#4F46E5' : '#64748B'}
          />
        </View>
        <Text
          className={`text-[10.5px] mt-0.5 tracking-tight ${
            activeRoute === 'MENU' ? 'text-primary font-bold' : 'text-muted-foreground font-semibold'
          }`}
          numberOfLines={1}
        >
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
};
