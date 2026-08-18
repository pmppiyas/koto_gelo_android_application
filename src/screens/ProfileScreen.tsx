import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { useAuth } from '../store/hooks';
import { AppButton } from '../components/common/AppButton';
import { appConfig } from '../config/appConfig';

export interface ProfileScreenProps {
  onNavigateToHome: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateToHome }) => {
  const { user, logout } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineEnabled, setOfflineEnabled] = useState(false);

  const handleLogout = async () => {
    await logout();
    onNavigateToHome();
  };

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderRowItem = (icon: keyof typeof Feather.glyphMap, label: string, showArrow: boolean = true, rightContent?: React.ReactNode) => (
    <TouchableOpacity style={styles.rowItem} activeOpacity={showArrow ? 0.7 : 1}>
      <View style={styles.rowItemLeft}>
        <Feather name={icon} size={20} color={colors.textSecondary} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowItemRight}>
        {rightContent}
        {showArrow && <Feather name="chevron-right" size={20} color={colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );

  const renderToggle = (enabled: boolean, onToggle: (val: boolean) => void) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onToggle(!enabled)}
      style={[styles.toggle, enabled && styles.toggleActive]}
    >
      <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Account')}
          {renderRowItem('user', 'Personal Information')}
          {renderRowItem('shield', 'Security')}
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Preferences')}
          {renderRowItem('bell', 'Notifications', false, renderToggle(notificationsEnabled, setNotificationsEnabled))}
          {renderRowItem('dollar-sign', 'Currency', true, <Text style={styles.currencyText}>BDT (৳)</Text>)}
          {renderRowItem('wifi-off', 'Offline Mode', false, renderToggle(offlineEnabled, setOfflineEnabled))}
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('App')}
          {renderRowItem('info', 'About KotoGelo')}
          {renderRowItem('help-circle', 'Help & Support')}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appConfig?.version || '1.0.0'}</Text>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <AppButton 
            title="Log Out" 
            variant="danger" 
            size="lg" 
            style={styles.logoutButton}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.lg,
    paddingHorizontal: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  userName: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: typography.md,
    color: colors.textPrimary,
  },
  rowItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currencyText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  versionContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  versionText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  logoutContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    width: '100%',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
