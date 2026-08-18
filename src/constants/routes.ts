export const ROUTES = {
  HOME: 'Home',
  LOGIN: 'Login',
  REGISTER: 'Register',
  DASHBOARD: 'Dashboard',
  TRANSACTIONS: 'Transactions',
  ADD_EXPENSE: 'AddExpense',
  PROFILE: 'Profile',
} as const;

export type RouteNames = (typeof ROUTES)[keyof typeof ROUTES];
