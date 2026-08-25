import { ENV } from './env';

export const API_BASE_URL = ENV.API_BASE_URL;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: `${API_BASE_URL}/auth/signin`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  USER: {
    ME: `${API_BASE_URL}/user/me`,
  },
  EXPENSES: {
    PERSONAL: `${API_BASE_URL}/expenses/personal`,
    SUMMARY: `${API_BASE_URL}/expenses/summary`,
  },
  GROUP: {
    BASE: `${API_BASE_URL}/group`,
    EXPENSES: `${API_BASE_URL}/group/expenses`,
    DEPOSITS: `${API_BASE_URL}/group/deposits`,
    SUMMARY: `${API_BASE_URL}/group/expenses/summary`,
    SETTLE: `${API_BASE_URL}/group/expenses/settle`,
    INVITATIONS: `${API_BASE_URL}/group/invitations`,
  },
} as const;
