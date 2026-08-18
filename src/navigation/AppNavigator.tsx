import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
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
    if (route === ROUTES.ADD_EXPENSE) {
      setPreviousRoute(currentRoute);
    }
    setCurrentRoute(route);
  };

  const displayName = user?.name || user?.username || 'User';

  const renderScreen = () => {
    switch (currentRoute) {
      case ROUTES.LOGIN:
        return (
          <LoginScreen
            onNavigateToRegister={() => setCurrentRoute(ROUTES.REGISTER)}
            onNavigateToHome={() => setCurrentRoute(ROUTES.HOME)}
            onLoginSuccess={() => setCurrentRoute(ROUTES.DASHBOARD)}
          />
        );

      case ROUTES.REGISTER:
        return (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentRoute(ROUTES.LOGIN)}
            onNavigateToHome={() => setCurrentRoute(ROUTES.HOME)}
            onRegisterSuccess={() => setCurrentRoute(ROUTES.DASHBOARD)}
          />
        );

      case ROUTES.TRANSACTIONS:
        return <TransactionsScreen />;

      case ROUTES.PROFILE:
        return (
          <ProfileScreen
            onNavigateToHome={() => setCurrentRoute(ROUTES.HOME)}
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
            onNavigateToTransactions={() => setCurrentRoute(ROUTES.TRANSACTIONS)}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.HOME:
      default:
        return (
          <HomeScreen
            isAuthenticated={isAuthenticated}
            userName={displayName}
            onNavigateToLogin={() => setCurrentRoute(ROUTES.LOGIN)}
            onNavigateToRegister={() => setCurrentRoute(ROUTES.REGISTER)}
            onNavigateToDashboard={() => setCurrentRoute(ROUTES.DASHBOARD)}
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
          activeRoute={currentRoute}
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
