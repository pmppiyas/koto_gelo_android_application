import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { MyExpensesScreen } from '../screens/MyExpensesScreen';
import { ExpenseAnalyticsScreen } from '../screens/ExpenseAnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { BottomTabBar } from './BottomTabBar';
import { Loading } from '../components/common/Loading';
import { useAuth } from '../store/hooks';
import { ROUTES, RouteNames } from '../constants/routes';

export const AppNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<RouteNames>(ROUTES.HOME);
  const [previousRoute, setPreviousRoute] = useState<RouteNames>(ROUTES.DASHBOARD);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentRoute((prev) =>
          prev === ROUTES.LOGIN || prev === ROUTES.REGISTER ? ROUTES.DASHBOARD : prev
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

  if (isLoading) {
    return <Loading message="Starting KotoGelo..." />;
  }

  const navigateTo = (route: RouteNames) => {
    setPreviousRoute(currentRoute);
    setCurrentRoute(route);
  };

  const displayName = user?.name || user?.username || 'User';

  const renderScreen = () => {
    switch (currentRoute) {
      case ROUTES.LOGIN:
        return (
          <LoginScreen
            onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
            onLoginSuccess={() => navigateTo(ROUTES.DASHBOARD)}
          />
        );

      case ROUTES.REGISTER:
        return (
          <RegisterScreen
            onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
            onRegisterSuccess={() => navigateTo(ROUTES.DASHBOARD)}
          />
        );

      case ROUTES.PERSONAL_EXPENSES:
        return (
          <MyExpensesScreen
            initialFilter="ALL"
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.DASHBOARD)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.TODAY_EXPENSES:
        return (
          <MyExpensesScreen
            initialFilter="TODAY"
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.DASHBOARD)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.EXPENSE_ANALYTICS:
      case ROUTES.EXPENSE_SUMMARY:
        return (
          <ExpenseAnalyticsScreen
            onNavigateBack={() => navigateTo(previousRoute || ROUTES.DASHBOARD)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.TRANSACTIONS:
        return <TransactionsScreen />;

      case ROUTES.PROFILE:
        return (
          <ProfileScreen
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
          />
        );

      case ROUTES.ADD_EXPENSE:
        return (
          <AddExpenseScreen
            onClose={() => setCurrentRoute(previousRoute || ROUTES.DASHBOARD)}
          />
        );

      case ROUTES.DASHBOARD:
        return (
          <DashboardScreen
            onNavigateToTransactions={() => navigateTo(ROUTES.TRANSACTIONS)}
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToTodayExpenses={() => navigateTo(ROUTES.TODAY_EXPENSES)}
            onNavigateToAnalytics={() => navigateTo(ROUTES.EXPENSE_ANALYTICS)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
            onNavigateToProfile={() => navigateTo(ROUTES.PROFILE)}
            onNavigateToHome={() => navigateTo(ROUTES.HOME)}
          />
        );

      case ROUTES.HOME:
      default:
        return (
          <HomeScreen
            isAuthenticated={isAuthenticated}
            userName={displayName}
            onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
            onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
            onNavigateToDashboard={() => navigateTo(ROUTES.DASHBOARD)}
          />
        );
    }
  };

  const showBottomNav =
    isAuthenticated &&
    currentRoute !== ROUTES.LOGIN &&
    currentRoute !== ROUTES.REGISTER &&
    currentRoute !== ROUTES.ADD_EXPENSE;

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      {showBottomNav && (
        <BottomTabBar
          activeRoute={
            currentRoute === ROUTES.PERSONAL_EXPENSES ||
            currentRoute === ROUTES.TODAY_EXPENSES ||
            currentRoute === ROUTES.EXPENSE_ANALYTICS ||
            currentRoute === ROUTES.EXPENSE_SUMMARY
              ? ROUTES.DASHBOARD
              : currentRoute
          }
          onNavigate={(route) => navigateTo(route as RouteNames)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
