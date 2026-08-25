import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BackHandler,
  ToastAndroid,
  Platform,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { View } from '../components/ui/core';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { ExpenseAnalyticsScreen } from '../screens/ExpenseAnalyticsScreenNew';
import { GroupsScreen } from '../screens/GroupsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GroupBalancesScreen } from '../screens/GroupBalancesScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { InvitationsScreen } from '../features/invitations/screens/InvitationsScreen';
import { BottomTabBar } from './BottomTabBar';
import { DashboardDrawer } from '../components/dashboard/DashboardDrawer';
import { Loading } from '../components/common/Loading';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAuth } from '../store/hooks';
import { ROUTES, RouteNames } from '../constants/routes';

export const AppNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [currentRoute, setCurrentRoute] = useState<RouteNames>(ROUTES.HOME);
  const [previousRoute, setPreviousRoute] = useState<RouteNames>(ROUTES.HOME);
  const [history, setHistory] = useState<RouteNames[]>([ROUTES.HOME]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const horizontalScrollRef = useRef<ScrollView>(null);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const lastBackPressTimeRef = useRef<number>(0);

  const MAIN_TAB_ORDER: RouteNames[] = [
    ROUTES.DASHBOARD,
    ROUTES.TRANSACTIONS,
    ROUTES.EXPENSE_ANALYTICS,
    ROUTES.GROUPS,
  ];

  const getTabIndexForRoute = useCallback((route: RouteNames): number => {
    if (route === ROUTES.HOME || route === ROUTES.DASHBOARD) return 0;
    if (
      route === ROUTES.TRANSACTIONS ||
      route === ROUTES.PERSONAL_EXPENSES ||
      route === ROUTES.TODAY_EXPENSES ||
      route === ROUTES.GROUP_EXPENSES
    )
      return 1;
    if (
      route === ROUTES.EXPENSE_ANALYTICS ||
      route === ROUTES.GROUP_ANALYTICS ||
      route === ROUTES.EXPENSE_SUMMARY
    )
      return 2;
    if (route === ROUTES.GROUPS) return 3;
    return -1;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // After login/register or token restore → go to Dashboard
      setCurrentRoute((prev) => {
        if (
          prev === ROUTES.LOGIN ||
          prev === ROUTES.REGISTER ||
          prev === ROUTES.HOME
        ) {
          setHistory([ROUTES.DASHBOARD]);
          return ROUTES.DASHBOARD;
        }
        return prev;
      });
    } else {
      // Not authenticated → kick back to Home/Login
      setCurrentRoute((prev) => {
        const publicRoutes: RouteNames[] = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER];
        if (!publicRoutes.includes(prev)) {
          setHistory([ROUTES.HOME]);
          return ROUTES.HOME;
        }
        return prev;
      });
    }
  }, [isAuthenticated, isLoading]);

  const isHomeRoute = (route: RouteNames) =>
    route === ROUTES.HOME || route === ROUTES.DASHBOARD;

  const navigateTo = (route: RouteNames, replace: boolean = false) => {
    if (route === currentRoute) return;

    setPreviousRoute(currentRoute);
    setCurrentRoute(route);

    const rootRoute = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME;

    setHistory((prev) => {
      if (replace) {
        return [...prev.slice(0, -1), route];
      }
      if (isHomeRoute(route)) {
        return [rootRoute];
      }
      if (prev[prev.length - 1] === route) {
        return prev;
      }
      return [...prev, route];
    });
  };

  const goBack = (): boolean => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return true;
    }

    const rootRoute = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME;

    // 1. If currently on root Home screen -> double press back to exit app
    if (isHomeRoute(currentRoute)) {
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTimeRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    }

    // 2. If on another main tab (Expenses, Analytics, Groups) -> go back to Home
    if (isMainTabActive) {
      setPreviousRoute(currentRoute);
      setCurrentRoute(rootRoute);
      setHistory([rootRoute]);
      return true;
    }

    // 3. If in a sub-screen / modal (AddExpense, Profile, GroupBalances, Invitations)
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const targetRoute = nextHistory[nextHistory.length - 1];
      setPreviousRoute(currentRoute);
      setCurrentRoute(targetRoute);
      setHistory(nextHistory);
      return true;
    }

    // Fallback to root Home
    setPreviousRoute(currentRoute);
    setCurrentRoute(rootRoute);
    setHistory([rootRoute]);
    return true;
  };

  // Listen to Android hardware back button and edge swipe gestures
  useEffect(() => {
    const onBackPress = () => {
      return goBack();
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [isDrawerOpen, history, currentRoute, isAuthenticated]);

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

  const handleDrawerLogout = () => {
    setIsDrawerOpen(false);
    setIsLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalVisible(false);
      setHistory([ROUTES.HOME]);
      setCurrentRoute(ROUTES.HOME);
    } catch {
      setIsLogoutModalVisible(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || user?.username || 'User';

  const isMainTabActive =
    isAuthenticated &&
    (currentRoute === ROUTES.HOME ||
      currentRoute === ROUTES.DASHBOARD ||
      currentRoute === ROUTES.TRANSACTIONS ||
      currentRoute === ROUTES.EXPENSE_ANALYTICS ||
      currentRoute === ROUTES.GROUPS);

  const activeMainTab =
    currentRoute === ROUTES.HOME || currentRoute === ROUTES.DASHBOARD
      ? ROUTES.DASHBOARD
      : currentRoute === ROUTES.TRANSACTIONS
      ? ROUTES.TRANSACTIONS
      : currentRoute === ROUTES.EXPENSE_ANALYTICS
      ? ROUTES.EXPENSE_ANALYTICS
      : currentRoute === ROUTES.GROUPS
      ? ROUTES.GROUPS
      : null;

  // Sync horizontal scroll position when currentRoute changes programmatically
  useEffect(() => {
    if (!isMainTabActive) return;
    const targetIdx = getTabIndexForRoute(currentRoute);
    if (targetIdx !== -1 && targetIdx !== activeTabIndex) {
      setActiveTabIndex(targetIdx);
      isProgrammaticScrollRef.current = true;
      horizontalScrollRef.current?.scrollTo({
        x: targetIdx * screenWidth,
        animated: true,
      });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 450);
    }
  }, [
    currentRoute,
    isMainTabActive,
    screenWidth,
    activeTabIndex,
    getTabIndexForRoute,
  ]);

  // Handle manual left-right swipe gesture (Instagram style)
  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (isProgrammaticScrollRef.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);

    if (
      newIndex >= 0 &&
      newIndex < MAIN_TAB_ORDER.length &&
      newIndex !== activeTabIndex
    ) {
      setActiveTabIndex(newIndex);
      const targetRoute = MAIN_TAB_ORDER[newIndex];
      setPreviousRoute(currentRoute);
      setCurrentRoute(targetRoute);
      const rootRoute = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME;
      if (isHomeRoute(targetRoute)) {
        setHistory([rootRoute]);
      } else {
        setHistory([rootRoute, targetRoute]);
      }
    }
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case ROUTES.LOGIN:
        return (
          <LoginScreen
            onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
            onNavigateToHome={() => goBack()}
            onLoginSuccess={() => {
              setHistory([ROUTES.DASHBOARD]);
              setCurrentRoute(ROUTES.DASHBOARD);
            }}
          />
        );

      case ROUTES.REGISTER:
        return (
          <RegisterScreen
            onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
            onNavigateToHome={() => goBack()}
            onRegisterSuccess={() => {
              setHistory([ROUTES.DASHBOARD]);
              setCurrentRoute(ROUTES.DASHBOARD);
            }}
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
            onNavigateBack={() => goBack()}
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
            onNavigateBack={() => goBack()}
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
            onNavigateBack={() => goBack()}
          />
        );

      case ROUTES.GROUP_ANALYTICS:
        return (
          <ExpenseAnalyticsScreen
            mode="GROUP"
            initialGroupId={selectedGroupId || undefined}
            onNavigateBack={() => goBack()}
            onNavigateToAddExpense={() => navigateTo(ROUTES.ADD_EXPENSE)}
          />
        );

      case ROUTES.GROUP_DETAILS:
      case ROUTES.GROUP_BALANCES:
      case ROUTES.SETTLEMENTS:
        return (
          <GroupBalancesScreen
            groupId={selectedGroupId || undefined}
            onNavigateBack={() => goBack()}
            onNavigateToPersonalExpenses={() => navigateTo(ROUTES.PERSONAL_EXPENSES)}
            onNavigateToAnalytics={() => navigateTo(ROUTES.GROUP_ANALYTICS)}
            onNavigateToTransactions={() => navigateTo(ROUTES.TRANSACTIONS)}
            onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
          />
        );

      case ROUTES.PROFILE:
        return (
          <ProfileScreen
            onNavigateToHome={() => goBack()}
          />
        );

      case ROUTES.INVITATIONS:
        return (
          <InvitationsScreen onNavigateBack={() => goBack()} />
        );

      case ROUTES.ADD_EXPENSE: {
        const groupRoutes: RouteNames[] = [
          ROUTES.GROUP_BALANCES,
          ROUTES.GROUP_EXPENSES,
          ROUTES.GROUP_ANALYTICS,
          ROUTES.GROUPS,
          ROUTES.SETTLEMENTS,
          ROUTES.GROUP_DETAILS,
        ];
        const isFromGroupContext = groupRoutes.includes(previousRoute);
        return (
          <AddExpenseScreen
            initialType={isFromGroupContext ? 'GROUP' : 'PERSONAL'}
            initialGroupId={isFromGroupContext && selectedGroupId ? selectedGroupId : undefined}
            onClose={(createdType, groupId) => {
              if (createdType === 'GROUP' && groupId) {
                setSelectedGroupId(groupId);
                navigateTo(ROUTES.GROUP_BALANCES, true);
              } else if (createdType === 'PERSONAL') {
                navigateTo(ROUTES.TRANSACTIONS, true);
              } else {
                goBack();
              }
            }}
          />
        );
      }

      default:
        if (!isAuthenticated) {
          return (
            <HomeScreen
              isAuthenticated={false}
              userName={displayName}
              onNavigateToLogin={() => navigateTo(ROUTES.LOGIN)}
              onNavigateToRegister={() => navigateTo(ROUTES.REGISTER)}
            />
          );
        }
        return null;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Loading text="Loading KotoGelo..." />
      </View>
    );
  }

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
          {isAuthenticated ? (
            <>
              {/* 1. Main Tab Screens Horizontal Pager (Instagram-style smooth 60fps swipe between tabs) */}
              <View
                className="flex-1"
                style={isMainTabActive ? undefined : { display: 'none' }}
              >
                <ScrollView
                  ref={horizontalScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  directionalLockEnabled={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  overScrollMode="never"
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                  scrollEventThrottle={16}
                  className="flex-1"
                  contentContainerStyle={{
                    width: screenWidth * MAIN_TAB_ORDER.length,
                  }}
                >
                  {/* Tab 0: Home / Dashboard */}
                  <View style={{ width: screenWidth }} className="flex-1">
                    <DashboardScreen
                      onNavigateToTransactions={() =>
                        navigateTo(ROUTES.TRANSACTIONS)
                      }
                      onNavigateToPersonalExpenses={() =>
                        navigateTo(ROUTES.PERSONAL_EXPENSES)
                      }
                      onNavigateToTodayExpenses={() =>
                        navigateTo(ROUTES.TODAY_EXPENSES)
                      }
                      onNavigateToAnalytics={() =>
                        navigateTo(ROUTES.EXPENSE_ANALYTICS)
                      }
                      onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
                      onNavigateToGroupExpenses={() =>
                        navigateTo(ROUTES.GROUP_EXPENSES)
                      }
                      onNavigateToAddExpense={() =>
                        navigateTo(ROUTES.ADD_EXPENSE)
                      }
                      onNavigateToProfile={() => navigateTo(ROUTES.PROFILE)}
                      onNavigateToHome={() => navigateTo(ROUTES.HOME)}
                    />
                  </View>

                  {/* Tab 1: Expenses / Transactions */}
                  <View style={{ width: screenWidth }} className="flex-1">
                    <TransactionsScreen
                      onNavigateToPersonalExpenses={() =>
                        navigateTo(ROUTES.PERSONAL_EXPENSES)
                      }
                      onNavigateToGroupExpenses={() =>
                        navigateTo(ROUTES.GROUP_EXPENSES)
                      }
                      onNavigateToGroups={() => navigateTo(ROUTES.GROUPS)}
                      onNavigateToDashboard={() => navigateTo(ROUTES.HOME)}
                      onNavigateToAddExpense={() =>
                        navigateTo(ROUTES.ADD_EXPENSE)
                      }
                    />
                  </View>

                  {/* Tab 2: Expense Analytics */}
                  <View style={{ width: screenWidth }} className="flex-1">
                    <ExpenseAnalyticsScreen
                      mode="PERSONAL"
                      onNavigateToAddExpense={() =>
                        navigateTo(ROUTES.ADD_EXPENSE)
                      }
                    />
                  </View>

                  {/* Tab 3: Groups */}
                  <View style={{ width: screenWidth }} className="flex-1">
                    <GroupsScreen
                      onSelectGroup={(id) => {
                        setSelectedGroupId(id);
                        navigateTo(ROUTES.GROUP_BALANCES);
                      }}
                    />
                  </View>
                </ScrollView>
              </View>

              {/* 2. Sub-Screens / Modal Screens */}
              {!isMainTabActive && renderScreen()}
            </>
          ) : (
            renderScreen()
          )}
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

      {/* Global Logout Confirmation Modal for Drawer */}
      <ConfirmModal
        visible={isLogoutModalVisible}
        title="Log Out"
        message="Are you sure you want to log out of your account? Your local data has been securely backed up."
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="danger"
        iconName="log-out"
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutModalVisible(false);
        }}
      />
    </View>
  );
};
