export const ROUTES = {
  HOME: 'Home',
  LOGIN: 'Login',
  REGISTER: 'Register',
  DASHBOARD: 'Dashboard',
  TRANSACTIONS: 'Transactions',
  PERSONAL_EXPENSES: 'PersonalExpenses',
  TODAY_EXPENSES: 'TodayExpenses',
  EXPENSE_SUMMARY: 'ExpenseAnalytics',
  EXPENSE_ANALYTICS: 'ExpenseAnalytics',
  ADD_EXPENSE: 'AddExpense',
  PROFILE: 'Profile',
} as const;

export type RouteNames = (typeof ROUTES)[keyof typeof ROUTES];
