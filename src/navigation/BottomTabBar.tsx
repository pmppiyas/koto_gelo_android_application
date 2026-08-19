import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  const renderTab = (route: string, icon: keyof typeof Feather.glyphMap, label: string) => {
    const isActive = activeRoute === route;

    return (
      <TouchableOpacity
        key={route}
        className={`flex-1 items-center justify-center py-1.5 mx-1 rounded-xl ${
          isActive ? 'bg-primary-light' : ''
        }`}
        onPress={() => onNavigate(route)}
        activeOpacity={0.7}
      >
        <Feather
          name={icon}
          size={20}
          color={isActive ? '#4F46E5' : '#94A3B8'}
        />
        <Text
          className={`text-[11px] mt-0.5 font-medium ${
            isActive ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className={`flex-row h-16 bg-card border-t border-border shadow-lg items-center px-1 ${
        Platform.OS === 'ios' ? 'pb-5' : 'pb-0'
      }`}
    >
      {renderTab(ROUTES.HOME, 'home', 'Home')}
      {renderTab(ROUTES.TRANSACTIONS, 'credit-card', 'Expenses')}

      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          className="-mt-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg border-4 border-card"
          onPress={() => onNavigate(ROUTES.ADD_EXPENSE)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {renderTab(ROUTES.EXPENSE_ANALYTICS, 'pie-chart', 'Analytics')}

      <TouchableOpacity
        className={`flex-1 items-center justify-center py-1.5 mx-1 rounded-xl ${
          activeRoute === 'MENU' ? 'bg-primary-light' : ''
        }`}
        onPress={onOpenDrawer}
        activeOpacity={0.7}
      >
        <Feather
          name="menu"
          size={20}
          color={activeRoute === 'MENU' ? '#4F46E5' : '#94A3B8'}
        />
        <Text
          className={`text-[11px] mt-0.5 font-medium ${
            activeRoute === 'MENU' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
};
