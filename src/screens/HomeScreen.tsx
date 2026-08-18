import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { useExpenses } from '../store/hooks';

export interface HomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToDashboard?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

const FEATURE_CARDS = [
  {
    icon: 'credit-card',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    title: 'Personal Expenses',
    desc: 'Track daily meals, commute, shopping, and bills with 35+ categories and instant smart search.',
  },
  {
    icon: 'users',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    title: 'Mess & Group Splits',
    desc: 'Split flat rent, mess grocery, tour budgets, and dining bills equally with zero manual math.',
  },
  {
    icon: 'pie-chart',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    title: 'Visual Analytics',
    desc: 'Understand spending trends with interactive category distribution charts and period comparisons.',
  },
  {
    icon: 'check-circle',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    title: 'Optimal Settlements',
    desc: 'Smart algorithms calculate minimum transactions so members can settle debts in one tap.',
  },
  {
    icon: 'wifi-off',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    title: 'Offline-First Engine',
    desc: 'Add expenses anywhere with zero internet. Your data syncs securely the moment you connect.',
  },
  {
    icon: 'shield',
    iconBg: '#CCFBF1',
    iconColor: '#0F766E',
    title: 'Privacy & Security',
    desc: 'Your financial data is protected with encrypted authentication and bank-grade storage.',
  },
];

const GROUP_USE_CASES = [
  { emoji: '🍲', label: 'Mess & Flat Meals', desc: 'Manage meal counts, grocery shopping & utility bills' },
  { emoji: '🎒', label: 'Tours & Trips', desc: 'Track hotel bookings, transport & shared food costs' },
  { emoji: '🏠', label: 'Roommates', desc: 'Split apartment rent, WiFi & maid service smoothly' },
  { emoji: '💼', label: 'Office & Team', desc: 'Team treats, project lunches & celebration costs' },
];

const FINANCIAL_TIPS = [
  {
    icon: 'trending-up',
    tag: 'Budgeting Rule',
    title: 'The 50/30/20 Rule',
    desc: 'Allocate 50% of your income for essentials, 30% for lifestyle wants, and save/invest the remaining 20%.',
  },
  {
    icon: 'coffee',
    tag: 'Daily Habit',
    title: 'Track Micro-Expenses',
    desc: 'Logging daily snacks, tea, and quick rides can uncover and save up to 25% of unmonitored monthly spending.',
  },
  {
    icon: 'zap',
    tag: 'Group Harmony',
    title: 'Instant Bill Logging',
    desc: 'Record shared group expenses on the spot to avoid end-of-month confusion and awkward calculations.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToDashboard,
  isAuthenticated = false,
  userName = 'User',
}) => {
  const { totalExpenseAmount, pendingExpenses } = useExpenses();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isAuthenticated ? BOTTOM_TAB_HEIGHT + spacing.sm : spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.logoGroup}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoSymbol}>৳</Text>
            </View>
            <View>
              <Text style={styles.logoText}>KotoGelo</Text>
              <Text style={styles.logoTagline}>Smart Financial Tracker</Text>
            </View>
          </View>

          <View style={styles.topBarActions}>
            {!isAuthenticated ? (
              <TouchableOpacity
                style={styles.loginOutlineBtn}
                onPress={onNavigateToLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginOutlineBtnText}>Log In</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.userBadgeBtn}
                onPress={onNavigateToDashboard}
                activeOpacity={0.8}
              >
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isAuthenticated ? (
          <View style={styles.authHeroCard}>
            <View style={styles.authHeroTop}>
              <View>
                <Text style={styles.authHeroGreeting}>Welcome Back,</Text>
                <Text style={styles.authHeroName}>{userName}</Text>
              </View>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>BDT (৳)</Text>
              </View>
            </View>

            <View style={styles.authBalanceRow}>
              <View>
                <Text style={styles.authBalanceLabel}>Today's Recorded Expenses</Text>
                <Text style={styles.authBalanceAmount}>৳{totalExpenseAmount.toLocaleString()}</Text>
              </View>
              {pendingExpenses.length > 0 && (
                <View style={styles.offlineChip}>
                  <Feather name="cloud-off" size={11} color="#B45309" />
                  <Text style={styles.offlineChipText}>{pendingExpenses.length} local</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.dashboardCtaBtn}
              onPress={onNavigateToDashboard}
              activeOpacity={0.85}
            >
              <Text style={styles.dashboardCtaBtnText}>Open My Dashboard</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestHero}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillEmoji}>✨</Text>
              <Text style={styles.heroPillText}>Your Complete Expense & Split Engine</Text>
            </View>

            <Text style={styles.heroMainTitle}>
              Take Complete Control of Your Money.
            </Text>

            <Text style={styles.heroDescription}>
              Track daily personal spending, split mess and tour budgets with friends, settle balances effortlessly, and gain visual financial clarity.
            </Text>

            <View style={styles.heroButtonRow}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={onNavigateToRegister}
                activeOpacity={0.85}
              >
                <Text style={styles.heroPrimaryBtnText}>Get Started Free</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={onNavigateToLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.heroSecondaryBtnText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.highlightBar}>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightNum}>35+</Text>
            <Text style={styles.highlightLabel}>Categories</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItem}>
            <Text style={styles.highlightNum}>100%</Text>
            <Text style={styles.highlightLabel}>Offline Ready</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItem}>
            <Text style={styles.highlightNum}>0৳</Text>
            <Text style={styles.highlightLabel}>Always Free</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTag}>FEATURES</Text>
            <Text style={styles.sectionHeading}>Everything You Need to Manage Money</Text>
            <Text style={styles.sectionSub}>Designed for seamless personal budgeting and frictionless group splits.</Text>
          </View>

          <View style={styles.featureGrid}>
            {FEATURE_CARDS.map((f, idx) => (
              <View key={idx} style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: f.iconBg }]}>
                  <Feather name={f.icon as any} size={20} color={f.iconColor} />
                </View>
                <Text style={styles.featureCardTitle}>{f.title}</Text>
                <Text style={styles.featureCardDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTag}>HOW IT WORKS</Text>
            <Text style={styles.sectionHeading}>Manage Finances in 3 Simple Steps</Text>
          </View>

          <View style={styles.stepsWrapper}>
            <View style={styles.stepCard}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Record in Seconds</Text>
                <Text style={styles.stepDesc}>Type the amount and pick from 35+ categories. Works even when you have no WiFi.</Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Split with Groups</Text>
                <Text style={styles.stepDesc}>Add flat roommates or tour buddies. KotoGelo automatically calculates equal shares.</Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Settle Up Instantly</Text>
                <Text style={styles.stepDesc}>View exactly who owes whom. Record payments with one tap to clear all dues.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTag}>GROUP SPLITS</Text>
            <Text style={styles.sectionHeading}>Built for Every Shared Expense</Text>
          </View>

          <View style={styles.useCaseGrid}>
            {GROUP_USE_CASES.map((uc, idx) => (
              <View key={idx} style={styles.useCaseCard}>
                <Text style={styles.useCaseEmoji}>{uc.emoji}</Text>
                <Text style={styles.useCaseLabel}>{uc.label}</Text>
                <Text style={styles.useCaseDesc}>{uc.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTag}>SMART HABITS</Text>
            <Text style={styles.sectionHeading}>Financial Wisdom & Tips</Text>
          </View>

          <View style={styles.tipsList}>
            {FINANCIAL_TIPS.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <View style={styles.tipTagBadge}>
                    <Feather name={tip.icon as any} size={11} color={colors.primary} />
                    <Text style={styles.tipTagText}>{tip.tag}</Text>
                  </View>
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {!isAuthenticated && (
          <View style={styles.bottomBanner}>
            <Text style={styles.bottomBannerEmoji}>🚀</Text>
            <Text style={styles.bottomBannerTitle}>Ready to Master Your Spending?</Text>
            <Text style={styles.bottomBannerSub}>Join smart savers tracking their expenses with KotoGelo today.</Text>
            <TouchableOpacity
              style={styles.bottomBannerBtn}
              onPress={onNavigateToRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.bottomBannerBtnText}>Create Free Account</Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logoSymbol: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoText: {
    fontSize: typography.lg,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  topBarActions: {},
  loginOutlineBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  loginOutlineBtnText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  authHeroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  authHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  authHeroGreeting: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#93C5FD',
  },
  authHeroName: {
    fontSize: typography.xl,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  currencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  authBalanceLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#BFDBFE',
    marginBottom: 2,
  },
  authBalanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  offlineChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  dashboardCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dashboardCtaBtnText: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guestHero: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  heroPillEmoji: {
    fontSize: 12,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  heroMainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 38,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  heroButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  heroPrimaryBtnText: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  heroSecondaryBtnText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  highlightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
  },
  highlightNum: {
    fontSize: typography.lg,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 2,
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  highlightDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: typography.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: typography.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureCardTitle: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  stepsWrapper: {
    gap: spacing.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  stepNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: typography.sm,
    fontWeight: '900',
    color: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.sm + 1,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  useCaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  useCaseCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  useCaseEmoji: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  useCaseLabel: {
    fontSize: typography.xs + 1,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  useCaseDesc: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipHeader: {
    marginBottom: spacing.xs,
  },
  tipTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tipTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  tipTitle: {
    fontSize: typography.sm + 1,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomBanner: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bottomBannerEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  bottomBannerTitle: {
    fontSize: typography.lg,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bottomBannerSub: {
    fontSize: typography.xs,
    color: '#93C5FD',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  bottomBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.full,
  },
  bottomBannerBtnText: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
