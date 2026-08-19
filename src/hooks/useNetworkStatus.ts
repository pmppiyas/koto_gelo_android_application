import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../config/api';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const PING_URL = `${API_BASE_URL.split('/api')[0]}/api/v1/health`;
const FALLBACK_PING = 'https://www.google.com';
const CHECK_INTERVAL_MS = 10000;

async function checkConnectivity(): Promise<boolean> {
  const targets = [PING_URL, FALLBACK_PING];
  for (const url of targets) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return true;
    } catch {}
  }
  return false;
}

export const useNetworkStatus = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = useCallback(async () => {
    const reachable = await checkConnectivity();
    setNetworkState({ isConnected: reachable, isInternetReachable: reachable });
  }, []);

  useEffect(() => {
    runCheck();

    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') runCheck();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [runCheck]);

  return networkState;
};
