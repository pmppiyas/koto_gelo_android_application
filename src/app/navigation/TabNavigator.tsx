import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { PersonalExpensesScreen } from '../../features/expenses/personal/screens/PersonalExpensesScreen';
import { GroupsScreen } from '../../features/groups/screens/GroupsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type TabType = 'dashboard' | 'expenses' | 'groups' | 'profile';

export const TabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'expenses':
        return <PersonalExpensesScreen />;
      case 'groups':
        return <GroupsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.activeTabItem]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'expenses' && styles.activeTabItem]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabLabel, activeTab === 'expenses' && styles.activeTabLabel]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'groups' && styles.activeTabItem]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabLabel, activeTab === 'groups' && styles.activeTabLabel]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.activeTabItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activeTabItem: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
