import React, { useState } from 'react';
import { TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from '../ui/core';
import { Logo } from '../common/Logo';

const { width } = Dimensions.get('window');
// Slimmer and sleeker drawer width with comfortable room for larger text
const DRAWER_WIDTH = Math.min(width * 0.76, 290);

export interface MenuItem {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  route?: string;
  action?: string;
  href?: string;
  iconColor?: string;
  iconBg?: string;
}

export interface MenuSection {
  title: string;
  collapsible: boolean;
  defaultExpanded: boolean;
  items: MenuItem[];
}

export interface DashboardDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectRoute?: (route: string) => void;
  onLogout?: () => void;
  currentRoute?: string;
}

const SECTIONS: MenuSection[] = [
  {
    title: 'PERSONAL',
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        title: 'My Expenses',
        icon: 'credit-card',
        route: 'PERSONAL_EXPENSES',
        href: '/expenses/personal',
        iconColor: '#059669',
        iconBg: 'bg-emerald-50',
      },
      {
        title: "Today's Expenses",
        icon: 'calendar',
        route: 'TODAY_EXPENSES',
        href: '/expenses/personal?filter=today',
        iconColor: '#0284C7',
        iconBg: 'bg-sky-50',
      },
      {
        title: 'Expense Analytics',
        icon: 'pie-chart',
        route: 'EXPENSE_ANALYTICS',
        href: '/expenses/analytics',
        iconColor: '#4F46E5',
        iconBg: 'bg-indigo-50',
      },
    ],
  },
  {
    title: 'GROUP',
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        title: 'My Groups',
        icon: 'users',
        route: 'GROUPS',
        href: '/group',
        iconColor: '#4F46E5',
        iconBg: 'bg-indigo-50',
      },
      {
        title: 'Invitations',
        icon: 'mail',
        route: 'INVITATIONS',
        href: '/group/invitations/my',
        iconColor: '#2563EB',
        iconBg: 'bg-blue-50',
      },
    ],
  },
];

const ACCOUNT_ITEMS: MenuItem[] = [
  {
    title: 'Profile',
    icon: 'user',
    route: 'PROFILE',
    href: '/user/me',
    iconColor: '#475569',
    iconBg: 'bg-slate-100',
  },
  {
    title: 'Settings',
    icon: 'settings',
    route: 'SETTINGS',
    href: '/settings',
    iconColor: '#475569',
    iconBg: 'bg-slate-100',
  },
  {
    title: 'Logout',
    icon: 'log-out',
    action: 'LOGOUT',
    iconColor: '#EF4444',
    iconBg: 'bg-rose-100',
  },
];

export const DashboardDrawer: React.FC<DashboardDrawerProps> = ({
  visible,
  currentRoute,
  onClose,
  onSelectRoute,
  onLogout,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    PERSONAL: true,
    GROUP: true,
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const isItemActive = (item: MenuItem) => {
    if (!item.route || !currentRoute) return false;
    if (item.route === currentRoute) return true;

    if (
      item.route === 'GROUPS' &&
      (currentRoute === 'Groups' ||
        currentRoute === 'GroupBalances' ||
        currentRoute === 'GroupDetails' ||
        currentRoute === 'GROUPS' ||
        currentRoute === 'GROUP_BALANCES' ||
        currentRoute === 'GROUP_DETAILS')
    ) {
      return true;
    }
    if (
      item.route === 'PERSONAL_EXPENSES' &&
      (currentRoute === 'PersonalExpenses' ||
        currentRoute === 'Transactions' ||
        currentRoute === 'PERSONAL_EXPENSES' ||
        currentRoute === 'TRANSACTIONS')
    ) {
      return true;
    }
    if (
      item.route === 'TODAY_EXPENSES' &&
      (currentRoute === 'TodayExpenses' || currentRoute === 'TODAY_EXPENSES')
    ) {
      return true;
    }
    if (
      item.route === 'EXPENSE_ANALYTICS' &&
      (currentRoute === 'ExpenseAnalytics' ||
        currentRoute === 'ExpenseSummary' ||
        currentRoute === 'GroupAnalytics' ||
        currentRoute === 'EXPENSE_ANALYTICS' ||
        currentRoute === 'EXPENSE_SUMMARY' ||
        currentRoute === 'GROUP_ANALYTICS')
    ) {
      return true;
    }
    if (
      item.route === 'INVITATIONS' &&
      (currentRoute === 'Invitations' || currentRoute === 'INVITATIONS')
    ) {
      return true;
    }
    if (
      item.route === 'PROFILE' &&
      (currentRoute === 'Profile' || currentRoute === 'PROFILE')
    ) {
      return true;
    }
    return false;
  };

  const handleItemPress = (item: MenuItem) => {
    onClose();
    if (item.action === 'LOGOUT') {
      onLogout?.();
    } else if (item.route) {
      onSelectRoute?.(item.route);
    }
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 flex-row justify-end">
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          className="absolute inset-0"
          style={
            {
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            } as any
          }
        />
      </TouchableWithoutFeedback>

      <SafeAreaView
        className="h-full bg-card shadow-2xl border-l border-border rounded-l-3xl overflow-hidden"
        style={{ width: DRAWER_WIDTH }}
      >
        <View className="flex-1 flex-col">
          {/* Top Brand Header with Close Button */}
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border bg-card">
            <Logo size="sm" showSubtitle={false} />
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-muted/80 items-center justify-center shadow-xs"
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Container with clean sections */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="p-3 gap-2"
            contentContainerStyle={{
              paddingBottom: Platform.OS === 'ios' ? 36 : 28,
            }}
            className="flex-1"
          >

            {/* Sections (Personal & Group) */}
            {SECTIONS.map((section) => {
              const isExpanded = !!expandedSections[section.title];
              return (
                <View key={section.title} className="mb-1">
                  <TouchableOpacity
                    className="flex-row items-center justify-between px-2.5 py-2"
                    onPress={() => section.collapsible && toggleSection(section.title)}
                    activeOpacity={section.collapsible ? 0.7 : 1}
                  >
                    <Text className="text-xs font-black text-slate-500 tracking-wider uppercase">
                      {section.title}
                    </Text>
                    {section.collapsible && (
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#94A3B8"
                      />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="gap-1 mt-0.5">
                      {section.items.map((item) => {
                        const isActive = isItemActive(item);
                        return (
                          <TouchableOpacity
                            key={item.title}
                            className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl border ${
                              isActive
                                ? 'bg-primary-light border-indigo-200 shadow-2xs'
                                : 'border-transparent active:bg-muted/60'
                            }`}
                            onPress={() => handleItemPress(item)}
                            activeOpacity={0.7}
                          >
                            <View
                              className={`w-8 h-8 rounded-xl items-center justify-center shadow-xs ${
                                isActive
                                  ? 'bg-primary shadow-xs'
                                  : item.iconBg || 'bg-muted'
                              }`}
                            >
                              <Feather
                                name={item.icon}
                                size={16}
                                color={isActive ? '#FFFFFF' : item.iconColor || '#4F46E5'}
                              />
                            </View>
                            <Text
                              className={`text-sm flex-1 ${
                                isActive
                                  ? 'text-primary font-black'
                                  : 'text-foreground font-bold'
                              }`}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            {isActive && (
                              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            <View className="h-[1px] bg-border/70 my-1" />

            {/* Account Section: Profile, Settings, Logout */}
            <View className="mb-1">
              <Text className="text-xs font-black text-slate-500 tracking-wider uppercase px-2.5 py-2">
                ACCOUNT
              </Text>
              <View className="gap-1 mt-0.5">
                {ACCOUNT_ITEMS.map((item) => {
                  const isLogout = item.action === 'LOGOUT';
                  const isActive = isItemActive(item);
                  return (
                    <TouchableOpacity
                      key={item.title}
                      className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl border ${
                        isLogout
                          ? 'bg-rose-50 border-rose-200 mt-1'
                          : isActive
                          ? 'bg-primary-light border-indigo-200 shadow-2xs'
                          : 'border-transparent active:bg-muted/60'
                      }`}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        className={`w-8 h-8 rounded-xl items-center justify-center shadow-xs ${
                          isLogout
                            ? 'bg-rose-100'
                            : isActive
                            ? 'bg-primary shadow-xs'
                            : item.iconBg || 'bg-muted'
                        }`}
                      >
                        <Feather
                          name={item.icon}
                          size={16}
                          color={
                            isLogout
                              ? '#EF4444'
                              : isActive
                              ? '#FFFFFF'
                              : item.iconColor || '#4F46E5'
                          }
                        />
                      </View>
                      <Text
                        className={`text-sm flex-1 ${
                          isLogout
                            ? 'text-destructive font-black'
                            : isActive
                            ? 'text-primary font-black'
                            : 'text-foreground font-bold'
                        }`}
                      >
                        {item.title}
                      </Text>
                      {isActive && !isLogout && (
                        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};
