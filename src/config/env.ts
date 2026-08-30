import { Platform } from 'react-native';
import Constants from 'expo-constants';

const resolveApiBaseUrl = (): string => {
  const envUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3000/api/v1';

  // If in web browser or remote https url, return as is
  if (Platform.OS === 'web' || !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // On Mobile Device:
  // 1. Try to get your computer's LAN IP from Expo (e.g. 192.168.x.x)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return envUrl.replace('localhost', ip).replace('127.0.0.1', ip);
    }
  }

  // 2. Android Emulator fallback (10.0.2.2 connects to host PC)
  if (Platform.OS === 'android') {
    return envUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return envUrl;
};

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  API_TIMEOUT:
    Number(process.env.EXPO_PUBLIC_API_TIMEOUT || process.env.API_TIMEOUT) ||
    15000,
  IS_DEV: __DEV__,
};

