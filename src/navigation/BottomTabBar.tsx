import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ROUTES } from '../constants/routes';
import { colors } from '../constants/colors';
import { BOTTOM_TAB_HEIGHT, FAB_SIZE } from '../constants/spacing';

export interface BottomTabBarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeRoute, onNavigate }) => {
  const renderTab = (route: string, icon: keyof typeof Feather.glyphMap, label: string) => {
    const isActive = activeRoute === route;

    return (
      <TouchableOpacity
        key={route}
        style={styles.tabContainer}
        onPress={() => onNavigate(route)}
        activeOpacity={0.7}
      >
        <Feather
          name={icon}
          size={22}
          color={isActive ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderTab(ROUTES.HOME, 'home', 'Home')}
      {renderTab(ROUTES.TRANSACTIONS, 'list', 'Activity')}

      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => onNavigate(ROUTES.ADD_EXPENSE)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {renderTab(ROUTES.DASHBOARD, 'grid', 'Dashboard')}
      {renderTab(ROUTES.PROFILE, 'user', 'Profile')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: BOTTOM_TAB_HEIGHT,
    backgroundColor: colors.navBackground || colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.navBorder || colors.borderLight,
    shadowColor: colors.fabShadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  activeDot: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 4 : 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    top: -(FAB_SIZE / 2 - 4),
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.fabPrimary || colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.fabShadow || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});
