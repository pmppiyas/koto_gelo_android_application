import React, { useState, useEffect } from 'react';
import { View } from '../components/ui/core';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { ExpenseAnalyticsScreen } from '../screens/ExpenseAnalyticsScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GroupBalancesScreen } from '../screens/GroupBalancesScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { InvitationsScreen } from '../features/invitations/screens/InvitationsScreen';
import { BottomTabBar } from './BottomTabBar';
import { DashboardDrawer } from '../components/dashboard/DashboardDrawer';
import { Loading } from '../components/common/Loading';
import { useAuth } from '../store/hooks';
import { ROUTES, RouteNames } from '../constants/routes';

export const AppNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<RouteNames>(ROUTES.HOME);
  const [previousRoute, setPreviousRoute] = useState<RouteNames>(ROUTES.HOME);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentRoute((prev) =>
          prev === ROUTES.LOGIN || prev === ROUTES.REGISTER ? ROUTES.HOME : prev
        );
      } else {
        setCurrentRoute((prev) =>
          prev !== ROUTES.LOGIN && prev !== ROUTES.REGISTER && prev !== ROUTES.HOME
            ? ROUTES.HOME
            : prev
        );
      }
    }
  }, [isAuthenticated, isLoading]);

  const navigateTo = (route: RouteNames) => {
    if (route !== currentRoute) {
      setPreviousRoute(currentRoute);
      setCurrentRoute(route);
    }
  };

  const handleDrawerSelectRoute = (route: string) => {
    setIsDrawerOpen(false);
    switch (route) {
      case 'DASHBOARD':
      case 'HOME':
        navigateTo(ROUTES.HOME);
        break;
      case 'PERSONAL_EXPENSES':
        navigateTo(ROUTES.PERSONAL_EXPENSES);
        break;
      case 'TODAY_EXPENSES':
        navigateTo(ROUTES.TODAY_EXPENSES);
        break;
      case 'EXPENSE_ANALYTICS':
        navigateTo(ROUTES.EXPENSE_ANALYTICS);
        break;
      case 'GROUP_ANALYTICS':
        navigateTo(ROUTES.GROUP_ANALYTICS);
        break;
      case 'GROUPS':
        navigateTo(ROUTES.GROUPS);
        break;
      case 'GROUP_EXPENSES':
      case 'GROUP_HISTORY':
        navigateTo(ROUTES.GROUP_EXPENSES);
        break;
      case 'GROUP_BALANCES':
      case 'SETTLEMENTS':
        navigateTo(ROUTES.GROUP_BALANCES);
        break;
      case 'PROFILE':
        navigateTo(ROUTES.PROFILE);
        break;
      case 'INVITATIONS':
        navigateTo(ROUTES.INVITATIONS);
        break;
      default:
        break;
    }
  };

  const handleDrawerLogout = async () => {
    setIsDrawerOpen(false);
    await logout();
    navigateTo(ROUTES.HOME);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Loading text="Loading KotoGelo..." />
      </View>
    );
  }

  const displayName = user?.name || user?.username || 'User';

  const renderScreen = () => {
    switch (currentRoute) {
      case ROUTES.LOGIN:
        return (
          <LoginScreen
            onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
            onLoginSuccess={() => navigateTo(ROUTES.HOME)}
          />
        );

      case ROUTES.REGISTER:
        return (
          <RegisterScreen
            onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
            onRegisterSuccess={() => navigateTo(ROUTES.HOME)}
          />
        );

      case ROUTES.TRANSACTIONS:
        return (
          <TransactionsScreen
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToGroupExpenses={() => navigateTo(ROUTES.GROUP_EXPENSES)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
            onNavigateToDashboard={() => navigateTo(ROUTES.HOME)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
          />
        );

      case ROUTES.PERSONAL_EXPENSES:
        return (
          <TransactionsScreen
            initialTab="PERSONAL"
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToGroupExpenses={() => navigateTo(ROUTES.GROUP_EXPENSES)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
            onNavigateToDashboard={() => navigateTo(ROUTES.HOME)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
          />
        );

      case ROUTES.TODAY_EXPENSES:
        return (
          <TransactionsScreen
            initialTab="PERSONAL"
            initialTimeFilter="TODAY"
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToGroupExpenses={() => navigateTo(ROUTES.GROUP_EXPENSES)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
            onNavigateToDashboard={() => navigateTo(ROUTES.HOME)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
          />
        );

      case ROUTES.GROUP_EXPENSES:
        return (
          <TransactionsScreen
            initialTab="GROUP"
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToGroupExpenses={() => navigateTo(ROUTES.GROUP_EXPENSES)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
            onNavigateToDashboard={() => navigateTo(ROUTES.HOME)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
          />
        );

      case ROUTES.EXPENSE_ANALYTICS:
      case ROUTES.EXPENSE_SUMMARY:
        return (
          <ExpenseAnalyticsScreen
            mode="PERSONAL"
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.GROUP_ANALYTICS:
        return (
          <ExpenseAnalyticsScreen
            mode="GROUP"
            initialGroupId={selectedGroupId || undefined}
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.GROUPS)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.GROUPS:
        return (
          <GroupsScreen
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.HOME)}
            onSelectGroup={(id) => {
              setSelectedGroupId(id);
              navigateTo(ROUTES.GROUP_BALANCES);
            }}
          />
        );

      case ROUTES.GROUP_DETAILS:
      case ROUTES.GROUP_BALANCES:
      case ROUTES.SETTLEMENTS:
        return (
          <GroupBalancesScreen
            groupId={selectedGroupId || undefined}
            onNavigateBack={() => navigateTo(ROUTES.GROUPS)}
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToAnalytics={() => navigateTo(ROUTES.GROUP_ANALYTICS)}
            onNavigateToTransactions={() => navigateTo(ROUTES.TRANSACTIONS)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
          />
        );

      case ROUTES.PROFILE:
        return (
          <ProfileScreen
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
          />
        );

      case ROUTES.INVITATIONS:
        return (
          <InvitationsScreen />
        );

      case ROUTES.ADD_EXPENSE:
        return (
          <AddExpenseScreen
            onClose={() => setCurrentRoute(previousRoute || ROUTES.HOME)}
          />
        );

      case ROUTES.DASHBOARD:
      case ROUTES.HOME:
      default:
        if (isAuthenticated) {
          return (
            <DashboardScreen
              onNavigateToTransactions={() => navigateTo(ROUTES.TRANSACTIONS)}
              onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
              onNavigateToTodayExpenses={() => navigateTo(ROUTES.TODAY_EXPENSES)}
              onNavigateToAnalytics={() => navigateTo(ROUTES.EXPENSE_ANALYTICS)}
              onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
              onNavigateToGroupExpenses={() => navigateTo(ROUTES.GROUP_EXPENSES)}
              onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
              onNavigateToProfile={() => navigateTo(ROUTES.PROFILE)}
              onNavigateToHome={() => navigateTo(ROUTES.HOME)}
            />
          );
        }
        return (
          <HomeScreen
            isAuthenticated={false}
            userName={displayName}
            onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
            onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
          />
        );
    }
  };

  const showBottomNav =
    isAuthenticated &&
    currentRoute !== ROUTES.LOGIN &&
    currentRoute !== ROUTES.REGISTER;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 relative overflow-hidden">
        <View
          className="flex-1"
          style={
            isDrawerOpen
              ? ({
                  filter: 'blur(3.5px)',
                  WebkitFilter: 'blur(3.5px)',
                  opacity: 0.88,
                } as any)
              : undefined
          }
        >
          {renderScreen()}
        </View>

        <DashboardDrawer
          visible={isDrawerOpen}
          currentRoute={currentRoute}
          onClose={() => setIsDrawerOpen(false)}
          onSelectRoute={handleDrawerSelectRoute}
          onLogout={handleDrawerLogout}
        />
      </View>
      {showBottomNav && (
        <BottomTabBar
          activeRoute={
            isDrawerOpen
              ? 'MENU'
              : currentRoute === ROUTES.EXPENSE_ANALYTICS ||
                currentRoute === ROUTES.EXPENSE_SUMMARY ||
                currentRoute === ROUTES.GROUP_ANALYTICS
              ? ROUTES.EXPENSE_ANALYTICS
              : currentRoute === ROUTES.TRANSACTIONS ||
                currentRoute === ROUTES.PERSONAL_EXPENSES ||
                currentRoute === ROUTES.TODAY_EXPENSES ||
                currentRoute === ROUTES.GROUP_EXPENSES
              ? ROUTES.TRANSACTIONS
              : currentRoute === ROUTES.HOME ||
                currentRoute === ROUTES.DASHBOARD
              ? ROUTES.HOME
              : currentRoute
          }
          onNavigate={(route) => {
            setIsDrawerOpen(false);
            navigateTo(route as RouteNames);
          }}
          onOpenDrawer={() => setIsDrawerOpen((prev) => !prev)}
        />
      )}
    </View>
  );
};
