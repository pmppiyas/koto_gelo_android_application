import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { AppButton } from '../components/common/AppButton';
import { FeatureCard } from '../components/home/FeatureCard';
import { AdvantageCard } from '../components/home/AdvantageCard';
import { homeFeatures, homeAdvantages, demoBalanceSummary } from '../data/demoData';

export interface HomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToDashboard?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToDashboard,
  isAuthenticated = false,
  userName = 'User',
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isAuthenticated ? BOTTOM_TAB_HEIGHT + spacing.lg : spacing.xxl }
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>৳</Text>
            </View>
            <Text style={styles.logoTitle}>KotoGelo</Text>
          </View>
          
          <View style={styles.topBarRight}>
            {!isAuthenticated ? (
              <AppButton 
                title="Log In" 
                variant="outline" 
                size="sm" 
                onPress={onNavigateToLogin} 
              />
            ) : (
              <TouchableOpacity style={styles.userContainer} onPress={onNavigateToDashboard}>
                <Text style={styles.userGreeting}>Hi, {userName}</Text>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.heroSection}>
          {isAuthenticated ? (
            <View style={styles.authHero}>
              <Text style={styles.greetingTitle}>Good morning, {userName}</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Current Balance</Text>
                <Text style={styles.summaryAmount}>৳{demoBalanceSummary.totalBalance.toLocaleString()}</Text>
                <View style={styles.expensePill}>
                  <Text style={styles.expensePillText}>
                    This month: ৳{demoBalanceSummary.totalExpense.toLocaleString()} spent
                  </Text>
                </View>
                <AppButton 
                  title="Go to Dashboard" 
                  variant="primary" 
                  style={styles.dashboardBtn}
                  onPress={onNavigateToDashboard}
                />
              </View>
            </View>
          ) : (
            <View style={styles.unauthHero}>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>✨ Smart Expense Management</Text>
              </View>
              <Text style={styles.heroHeadline}>Take control of your money.</Text>
              <Text style={styles.heroSubtext}>
                Track expenses, understand your spending and stay in control of your finances.
              </Text>
              <View style={styles.heroActions}>
                <AppButton 
                  title="Get Started" 
                  variant="primary" 
                  size="lg" 
                  onPress={onNavigateToRegister}
                  style={styles.heroBtn}
                />
                <AppButton 
                  title="Login" 
                  variant="outline" 
                  size="lg" 
                  onPress={onNavigateToLogin}
                  style={styles.heroBtn}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Text style={styles.sectionSubtitle}>Everything you need to manage your finances.</Text>
          <View style={styles.featuresContainer}>
            {homeFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why KotoGelo?</Text>
          <View style={styles.advantagesContainer}>
            {homeAdvantages.map((advantage, index) => (
              <AdvantageCard key={index} advantage={advantage} />
            ))}
          </View>
        </View>

        {!isAuthenticated && (
          <View style={styles.bottomCtaBanner}>
            <Text style={styles.ctaTitle}>Ready to take control?</Text>
            <AppButton 
              title="Create Account" 
              variant="primary" 
              onPress={onNavigateToRegister} 
              style={styles.ctaBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    color: colors.surface,
    fontSize: typography.lg,
    fontWeight: 'bold',
  },
  logoTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userGreeting: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: 'bold',
  },
  heroSection: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  authHero: {
    width: '100%',
  },
  greetingTitle: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.hero,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  expensePill: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  expensePillText: {
    color: colors.danger,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  dashboardBtn: {
    width: '100%',
  },
  unauthHero: {
    alignItems: 'flex-start',
  },
  pillBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  pillBadgeText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  heroHeadline: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  heroSubtext: {
    fontSize: typography.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  heroActions: {
    width: '100%',
    gap: spacing.md,
  },
  heroBtn: {
    width: '100%',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  featuresContainer: {
    gap: spacing.md,
  },
  advantagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomCtaBanner: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ctaTitle: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: colors.surface,
  }
});
