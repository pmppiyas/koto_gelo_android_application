import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';
import { useAuth } from '../../store/hooks';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.8, 320);

export interface MenuItem {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  route?: string;
  action?: string;
  href?: string;
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
}

const DASHBOARD_MENU: MenuItem = {
  title: 'Dashboard',
  icon: 'home',
  route: 'DASHBOARD',
  href: '/dashboard',
};

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
      },
      {
        title: "Today's Expenses",
        icon: 'calendar',
        route: 'TODAY_EXPENSES',
        href: '/expenses/personal?filter=today',
      },
      {
        title: 'Expense Summary',
        icon: 'bar-chart-2',
        route: 'EXPENSE_SUMMARY',
        href: '/expenses/summary',
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
      },
      {
        title: 'Group Expenses',
        icon: 'file-text',
        route: 'GROUP_EXPENSES',
        href: '/group/expenses',
      },
      {
        title: 'Balances',
        icon: 'layers',
        route: 'GROUP_BALANCES',
        href: '/group/expenses/balance',
      },
      {
        title: 'Settlements',
        icon: 'check-circle',
        route: 'SETTLEMENTS',
        href: '/group/expenses/settle',
      },
      {
        title: 'History',
        icon: 'clock',
        route: 'GROUP_HISTORY',
        href: '/group/expenses/history',
      },
      {
        title: 'Invitations',
        icon: 'mail',
        route: 'INVITATIONS',
        href: '/group/invitations/my',
      },
    ],
  },
];

const BOTTOM_ITEMS: MenuItem[] = [
  {
    title: 'Profile',
    icon: 'user',
    route: 'PROFILE',
    href: '/user/me',
  },
  {
    title: 'Settings',
    icon: 'settings',
    route: 'SETTINGS',
    href: '/settings',
  },
  {
    title: 'Logout',
    icon: 'log-out',
    action: 'LOGOUT',
  },
];

export const DashboardDrawer: React.FC<DashboardDrawerProps> = ({
  visible,
  onClose,
  onSelectRoute,
  onLogout,
}) => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    PERSONAL: true,
    GROUP: true,
  });

  const displayName = user?.name || user?.username || 'User';
  const displayEmail = user?.email || `@${user?.username || 'user'}`;
  const initial = displayName.charAt(0).toUpperCase();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const handleItemPress = (item: MenuItem) => {
    onClose();
    if (item.action === 'LOGOUT') {
      onLogout?.();
    } else if (item.route) {
      onSelectRoute?.(item.route);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <SafeAreaView style={styles.drawerContainer}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={styles.userInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {displayEmail}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              <TouchableOpacity
                style={[styles.menuItem, styles.activeMenuItem]}
                onPress={() => handleItemPress(DASHBOARD_MENU)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIconBadge, styles.activeItemIconBadge]}>
                  <Feather name={DASHBOARD_MENU.icon} size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.menuItemText, styles.activeMenuItemText]}>
                  {DASHBOARD_MENU.title}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {SECTIONS.map((section) => {
                const isExpanded = !!expandedSections[section.title];
                return (
                  <View key={section.title} style={styles.sectionContainer}>
                    <TouchableOpacity
                      style={styles.sectionHeader}
                      onPress={() => section.collapsible && toggleSection(section.title)}
                      activeOpacity={section.collapsible ? 0.7 : 1}
                    >
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      {section.collapsible && (
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textMuted}
                        />
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.sectionItems}>
                        {section.items.map((item) => (
                          <TouchableOpacity
                            key={item.title}
                            style={styles.menuItem}
                            onPress={() => handleItemPress(item)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.itemIconBadge}>
                              <Feather name={item.icon} size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.menuItemText}>{item.title}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.bottomSection}>
              <View style={styles.divider} />
              {BOTTOM_ITEMS.map((item) => {
                const isLogout = item.action === 'LOGOUT';
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={[styles.menuItem, isLogout && styles.logoutMenuItem]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconBadge, isLogout && styles.logoutIconBadge]}>
                      <Feather
                        name={item.icon}
                        size={16}
                        color={isLogout ? colors.danger : colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.menuItemText, isLogout && styles.logoutText]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollBody: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  activeMenuItem: {
    backgroundColor: colors.primaryLight,
  },
  itemIconBadge: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  activeItemIconBadge: {
    backgroundColor: colors.primary,
  },
  menuItemText: {
    fontSize: typography.sm + 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activeMenuItemText: {
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  sectionContainer: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionItems: {
    paddingLeft: spacing.xs,
  },
  bottomSection: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  logoutMenuItem: {
    marginTop: 2,
  },
  logoutIconBadge: {
    backgroundColor: colors.dangerLight,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
