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
  GROUPS: 'Groups',
  GROUP_EXPENSES: 'GroupExpenses',
  GROUP_BALANCES: 'GroupBalances',
  GROUP_ANALYTICS: 'GroupAnalytics',
  SETTLEMENTS: 'Settlements',
  GROUP_HISTORY: 'GroupHistory',
  INVITATIONS: 'Invitations',
  CREATE_GROUP: 'CreateGroup',
  GROUP_DETAILS: 'GroupDetails',
  ADD_EXPENSE: 'AddExpense',
  PROFILE: 'Profile',
} as const;

export type RouteNames = (typeof ROUTES)[keyof typeof ROUTES];
