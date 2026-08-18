export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  PERSONAL_EXPENSES: {
    BASE: '/expenses/personal',
    BY_ID: (id: string) => `/expenses/personal/${id}`,
    CATEGORIES: '/expenses/personal/categories',
  },
  GROUPS: {
    BASE: '/group',
    BY_ID: (id: string) => `/group/${id}`,
    MEMBERS: (id: string) => `/group/${id}/members`,
  },
  GROUP_EXPENSES: {
    BASE: (groupId?: string) => (groupId ? `/group/expenses?groupId=${groupId}` : '/group/expenses'),
    BY_ID: (expenseId: string, _groupId?: string) => `/group/expenses/${expenseId}`,
    SUMMARY: '/group/expenses/summary',
    SETTLE: '/group/expenses/settle',
    SETTLE_EXPENSE: (expenseId: string) => `/group/expenses/${expenseId}/settle`,
    GROUP_SUMMARY: (groupId: string) => `/group/expenses/${groupId}/summary`,
    BALANCES: (groupId: string) => `/group/expenses/${groupId}/balance`,
    SETTLEMENTS: (groupId: string) => `/group/expenses/${groupId}/settlements`,
    HISTORY: (groupId: string) => `/group/expenses/${groupId}/history`,
  },
  INVITATIONS: {
    MY: '/group/invitations/my',
    BASE: '/group/invitations/my',
    BY_ID: (id: string) => `/group/invitations/${id}`,
    ACCEPT: (id: string) => `/group/invitations/${id}/accept`,
    REJECT: (id: string) => `/group/invitations/${id}/reject`,
    GROUP_BASE: (groupId: string) => `/group/${groupId}/invitations`,
    REQUEST_JOIN: (groupId: string) => `/group/${groupId}/invitations/request-join`,
    GROUP_ACCEPT: (groupId: string, id: string) => `/group/${groupId}/invitations/${id}/accept`,
    GROUP_REJECT: (groupId: string, id: string) => `/group/${groupId}/invitations/${id}/reject`,
  },
  PROFILE: {
    ME: '/user/me',
    UPDATE: '/user/me',
  },
  USER: {
    ME: '/user/me',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
} as const;
