import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Button,
} from '../components/ui';
import { Logo, AppLogoIcon } from '../components/common/Logo';
import { spacing } from '../constants/spacing';

export interface HomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToDashboard?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

const FEATURE_CARDS = [
  {
    icon: 'credit-card' as const,
    iconBg: 'bg-indigo-50',
    iconColor: '#4F46E5',
    title: 'Personal Daily Tracking',
    desc: 'Log meals, commute, shopping, and utilities in seconds with 35+ categories and smart filters.',
  },
  {
    icon: 'users' as const,
    iconBg: 'bg-blue-50',
    iconColor: '#2563EB',
    title: 'Mess & Group Splits',
    desc: 'Split mess groceries, apartment rent, and tour bills equally with zero manual calculations.',
  },
  {
    icon: 'pie-chart' as const,
    iconBg: 'bg-emerald-50',
    iconColor: '#059669',
    title: 'Visual Spending Analytics',
    desc: 'Understand your monthly expenditure with interactive category breakdowns and percentage bars.',
  },
  {
    icon: 'check-circle' as const,
    iconBg: 'bg-teal-50',
    iconColor: '#0D9488',
    title: 'Instant Debt Settlement',
    desc: 'Know exactly who owes whom. Auto-calculate net balances and settle in one tap.',
  },
  {
    icon: 'wifi-off' as const,
    iconBg: 'bg-sky-50',
    iconColor: '#0284C7',
    title: 'Offline-First Storage',
    desc: 'Add expenses anywhere with zero internet connection. Everything syncs securely when online.',
  },
  {
    icon: 'shield' as const,
    iconBg: 'bg-purple-50',
    iconColor: '#7C3AED',
    title: 'Private & Secure',
    desc: 'JWT authentication, encrypted local storage, and automatic backup protect your financial records.',
  },
];

const POPULAR_CATEGORIES = [
  { emoji: '🍲', name: 'Food & Dining' },
  { emoji: '🛒', name: 'Mess Grocery' },
  { emoji: '🏠', name: 'House Rent' },
  { emoji: '🚗', name: 'Travel & Taxi' },
  { emoji: '💡', name: 'Utility Bills' },
  { emoji: '🎒', name: 'Tour & Trips' },
  { emoji: '🛍️', name: 'Shopping' },
  { emoji: '🏥', name: 'Medical' },
];

const WORKFLOW_STEPS = [
  {
    step: '1',
    title: 'Log Daily Expenses',
    desc: 'Quickly record personal or group expenses with category tags and dates.',
    icon: 'edit-3' as const,
  },
  {
    step: '2',
    title: 'Collaborate in Groups',
    desc: 'Invite roommates, mess members, or tour companions with a simple invite.',
    icon: 'user-plus' as const,
  },
  {
    step: '3',
    title: 'Auto Split & Settle',
    desc: 'KotoGelo divides costs equally and tracks every member’s deposit and share.',
    icon: 'check-square' as const,
  },
];

const FAQS = [
  {
    q: 'Is KotoGelo completely free to use?',
    a: 'Yes! KotoGelo is 100% free with unlimited personal expenses, group splits, and analytics.',
  },
  {
    q: 'Can I track expenses when I have no internet connection?',
    a: 'Absolutely. KotoGelo is built with an offline-first engine. You can log expenses offline, and they will automatically sync as soon as you reconnect.',
  },
  {
    q: 'How does equal share calculation work for groups?',
    a: 'Total group expenses are automatically divided by total members. Members who deposited more than their equal share receive money (+), while those who deposited less see their exact pending dues (-).',
  },
  {
    q: 'Can I invite friends who are on other devices?',
    a: 'Yes! You can invite members directly using their username. They can accept the invitation to instantly see the shared group balance and activity.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<'PERSONAL' | 'GROUP'>(
    'PERSONAL',
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Brand Header Bar */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
        <Logo size="sm" showSubtitle={false} />

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="px-3.5 py-1.5 rounded-xl bg-slate-100"
            onPress={onNavigateToLogin}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-bold text-slate-800">Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3.5 py-1.5 rounded-xl bg-primary shadow-xs"
            onPress={onNavigateToRegister}
            activeOpacity={0.8}
          >
            <Text className="text-xs font-bold text-white">Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-2 gap-3"
        contentContainerStyle={{ paddingBottom: 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Main Luxury Black Hero Banner */}
        <View className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs">
              <AppLogoIcon size={48} />
            </View>
            <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
              <Text className="text-[11px] font-bold text-indigo-200">
                ✨ Pro Edition • 100% Free
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-white tracking-tight leading-tight mb-2">
            Smart Expense & Mess Tracker
          </Text>

          <Text className="text-xs text-slate-300 leading-relaxed mb-5">
            Track every taka, split mess groceries equally, manage roommate
            bills, and settle group tour expenses with zero manual math.
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl bg-primary items-center justify-center shadow-md shadow-indigo-500/20 active:opacity-90"
              onPress={onNavigateToRegister}
              activeOpacity={0.8}
            >
              <Text className="text-white font-extrabold text-xs">
                Get Started Free →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 items-center justify-center active:bg-slate-750"
              onPress={onNavigateToLogin}
              activeOpacity={0.8}
            >
              <Text className="text-slate-100 font-bold text-xs">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Highlight Stats Row */}
          <View className="flex-row items-center justify-between pt-4 border-t border-slate-800/80">
            <View className="items-center justify-center flex-1">
              <Text className="text-sm font-black text-white text-center">
                100%
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-0.5 text-center">
                Free Always
              </Text>
            </View>
            <View className="w-[1px] h-6 bg-slate-800" />
            <View className="items-center justify-center flex-1">
              <Text className="text-sm font-black text-emerald-400 text-center">
                Offline
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-0.5 text-center">
                Ready Engine
              </Text>
            </View>
            <View className="w-[1px] h-6 bg-slate-800" />
            <View className="items-center justify-center flex-1">
              <Text className="text-sm font-black text-indigo-300 text-center">
                0%
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-0.5 text-center">
                Math Errors
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Interactive Interactive Live Demo Card (Personal & Group Switcher) */}
        <View className="bg-card rounded-3xl p-3 border border-border shadow-xs gap-3.5">
          {/* Header with Title and Segmented Switcher */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-extrabold text-foreground">
                Interactive Live Preview
              </Text>
              <Text className="text-xs text-muted-foreground">
                See how easy tracking & splitting feels
              </Text>
            </View>
            <View className="bg-primary-light px-2 py-0.5 rounded-full border border-indigo-200">
              <Text className="text-[10px] font-bold text-primary">
                Live Demo
              </Text>
            </View>
          </View>

          {/* Tab Switcher: Personal Demo vs Group Split Demo */}
          <View className="flex-row bg-muted/60 p-1 rounded-2xl border border-border">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
                activeDemoTab === 'PERSONAL'
                  ? 'bg-card shadow-xs border border-border'
                  : ''
              }`}
              onPress={() => setActiveDemoTab('PERSONAL')}
              activeOpacity={0.8}
            >
              <Feather
                name="credit-card"
                size={14}
                color={activeDemoTab === 'PERSONAL' ? '#4F46E5' : '#64748B'}
              />
              <Text
                className={`text-xs font-bold ${
                  activeDemoTab === 'PERSONAL'
                    ? 'text-primary font-black'
                    : 'text-muted-foreground'
                }`}
              >
                Personal Tracker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
                activeDemoTab === 'GROUP'
                  ? 'bg-card shadow-xs border border-border'
                  : ''
              }`}
              onPress={() => setActiveDemoTab('GROUP')}
              activeOpacity={0.8}
            >
              <Feather
                name="users"
                size={14}
                color={activeDemoTab === 'GROUP' ? '#4F46E5' : '#64748B'}
              />
              <Text
                className={`text-xs font-bold ${
                  activeDemoTab === 'GROUP'
                    ? 'text-primary font-black'
                    : 'text-muted-foreground'
                }`}
              >
                Mess & Group Split
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: PERSONAL EXPENSE TRACKER DEMO */}
          {activeDemoTab === 'PERSONAL' ? (
            <View className="gap-3 pt-1">
              {/* Monthly Overview Card */}
              <View className="bg-muted/40 p-4 rounded-2xl border border-border/60">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-[10px] text-muted-foreground font-semibold uppercase">
                      This Month's Spending
                    </Text>
                    <Text className="text-xl font-black text-foreground mt-0.5">
                      ৳14,250
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Remaining Budget
                    </Text>
                    <Text className="text-sm font-extrabold text-emerald-600 mt-0.5">
                      ৳5,750 Left (28%)
                    </Text>
                  </View>
                </View>

                {/* Visual Progress Bar */}
                <View className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-1.5">
                  <View
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: '71%' }}
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[10px] text-muted-foreground">
                    Monthly Budget: ৳20,000
                  </Text>
                  <Text className="text-[10px] font-bold text-indigo-600">
                    71% Utilized
                  </Text>
                </View>
              </View>

              {/* Sample Personal Transactions Feed */}
              <View className="gap-2">
                <Text className="text-xs font-extrabold text-foreground px-1">
                  Recent Personal Logs
                </Text>

                <View className="flex-row items-center justify-between p-3 bg-card rounded-xl border border-border shadow-2xs">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-xl bg-orange-50 items-center justify-center">
                      <Text className="text-sm">🍔</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-foreground">
                        Dinner with Friends
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        Food & Dining • Today
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs font-black text-foreground">
                    ৳650
                  </Text>
                </View>

                <View className="flex-row items-center justify-between p-3 bg-card rounded-xl border border-border shadow-2xs">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center">
                      <Text className="text-sm">🛒</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-foreground">
                        Weekly Mess Grocery
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        Grocery • Yesterday
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs font-black text-foreground">
                    ৳1,420
                  </Text>
                </View>

                <View className="flex-row items-center justify-between p-3 bg-card rounded-xl border border-border shadow-2xs">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-xl bg-sky-50 items-center justify-center">
                      <Text className="text-sm">🚗</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-foreground">
                        CNG Commute to Office
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        Transport • 2 days ago
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs font-black text-foreground">
                    ৳180
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* TAB 2: MESS & GROUP SPLIT DEMO */
            <View className="gap-3 pt-1">
              {/* Group Equal Share Box */}
              <View className="bg-muted/40 p-4 rounded-2xl border border-border/60">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Total Mess Expense
                    </Text>
                    <Text className="text-xl font-black text-foreground mt-0.5">
                      ৳12,000
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground font-semibold uppercase">
                      (4 Members)
                    </Text>
                    <Text className="text-sm font-extrabold text-primary mt-0.5">
                      ৳3,000 / person
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1.5 bg-primary-light px-2.5 py-1 rounded-xl border border-indigo-200">
                  <Feather name="info" size={12} color="#4F46E5" />
                  <Text className="text-[10px] font-bold text-primary">
                    Equal share calculated automatically without math errors
                  </Text>
                </View>
              </View>

              {/* Member Settlement Breakdown Sample */}
              <View className="gap-2">
                <Text className="text-xs font-extrabold text-foreground px-1">
                  Member Balances & Settlements
                </Text>

                <View className="flex-row items-center justify-between p-3 bg-card rounded-xl border border-border shadow-2xs">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                      <Text className="text-xs font-bold text-emerald-700">
                        T
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-foreground">
                        Tanvir (Deposited ৳4,500)
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        Paid ৳1,500 over share
                      </Text>
                    </View>
                  </View>
                  <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Text className="text-[10px] font-bold text-emerald-700">
                      +৳1,500 receive
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between p-3 bg-card rounded-xl border border-border shadow-2xs">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                      <Text className="text-xs font-bold text-rose-700">R</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-foreground">
                        Rafiq (Deposited ৳2,000)
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        Short by ৳1,000
                      </Text>
                    </View>
                  </View>
                  <View className="bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    <Text className="text-[10px] font-bold text-rose-700">
                      -৳1,000 pay due
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 3. Popular Categories Carousel Showcase */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base font-extrabold text-foreground">
              Track Everything
            </Text>
            <Text className="text-xs text-primary font-semibold">
              35+ Categories
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 py-1"
          >
            {POPULAR_CATEGORIES.map((cat, idx) => (
              <View
                key={idx}
                className="flex-row items-center gap-2 bg-card px-3 py-2 rounded-2xl border border-border shadow-2xs"
              >
                <Text className="text-lg">{cat.emoji}</Text>
                <Text className="text-xs font-bold text-foreground">
                  {cat.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 4. 3-Step Workflow: How KotoGelo Works */}
        <View className="bg-card rounded-3xl p-3 border border-border shadow-xs gap-3.5">
          <View className="px-1">
            <Text className="text-base font-extrabold text-foreground">
              How KotoGelo Works
            </Text>
            <Text className="text-xs text-muted-foreground">
              3 simple steps to effortless expense management
            </Text>
          </View>

          <View className="gap-3 pt-1">
            {WORKFLOW_STEPS.map((item, idx) => (
              <View
                key={idx}
                className="flex-row items-start gap-3.5 bg-muted/30 p-3.5 rounded-2xl border border-border/60"
              >
                <View className="w-8 h-8 rounded-xl bg-primary items-center justify-center shadow-xs">
                  <Text className="text-xs font-black text-white">
                    {item.step}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-0.5">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Core Feature Grid */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base font-extrabold text-foreground">
              Why KotoGelo?
            </Text>
            <Text className="text-xs text-primary font-semibold">
              All-in-one Toolkit
            </Text>
          </View>

          <View className="gap-2.5">
            {FEATURE_CARDS.map((f, idx) => (
              <View
                key={idx}
                className="flex-row items-center gap-3.5 bg-card p-4 rounded-2xl border border-border shadow-xs"
              >
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center ${f.iconBg}`}
                >
                  <Feather name={f.icon} size={20} color={f.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground mb-0.5">
                    {f.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Interactive FAQ Accordion */}
        <View className="bg-card rounded-3xl p-3 border border-border shadow-xs gap-3">
          <View className="px-1">
            <Text className="text-base font-extrabold text-foreground">
              Frequently Asked Questions
            </Text>
            <Text className="text-xs text-muted-foreground">
              Answers to common questions about KotoGelo
            </Text>
          </View>

          <View className="gap-2 pt-1">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  className="bg-muted/40 rounded-2xl border border-border/60 p-3.5 active:bg-muted/60"
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-foreground flex-1 pr-2">
                      {faq.q}
                    </Text>
                    <Feather
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#64748B"
                    />
                  </View>
                  {isOpen && (
                    <Text className="text-xs text-muted-foreground leading-relaxed mt-2.5 pt-2.5 border-t border-border/50">
                      {faq.a}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Bottom Conversion CTA Card */}
        <View className="bg-primary rounded-3xl p-6 shadow-xl items-center text-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center shadow-xs">
            <Feather name="zap" size={24} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-black text-white text-center">
            Ready to Take Control of Your Money?
          </Text>
          <Text className="text-xs text-indigo-100 text-center leading-relaxed">
            Join thousands tracking daily costs and splitting flat bills with
            complete clarity.
          </Text>
          <TouchableOpacity
            className="w-full py-3.5 rounded-2xl bg-white items-center justify-center shadow-md mt-1"
            onPress={onNavigateToRegister}
            activeOpacity={0.8}
          >
            <Text className="text-xs font-extrabold text-primary">
              Create Your Free Account →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View className="items-center py-2 gap-1">
          <Text className="text-[11px] font-bold text-muted-foreground">
            KotoGelo • Smart Expense & Mess Tracker
          </Text>
          <Text className="text-[10px] text-muted-foreground/70">
            v1.0.0 Pro Edition • Bank-Grade Privacy & Security
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
