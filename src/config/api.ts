import { Platform, NativeModules } from 'react-native';

const getDevServerHost = (): string => {
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0];
      const host = address?.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {}

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};

const host = getDevServerHost();

export const API_BASE_URL =
  process.env.API_BASE_URL || `http://${host}:3000/api/v1`;

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
