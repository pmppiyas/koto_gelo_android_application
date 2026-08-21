import { storage, STORAGE_KEYS } from '../config/storage';

type AuthEventListener = () => void;
const unauthorizedListeners: Set<AuthEventListener> = new Set();

let isEmitting = false;

export const onUnauthorized = (listener: AuthEventListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const handleUnauthorized = async (): Promise<void> => {
  if (isEmitting) return;
  isEmitting = true;

  try {
    // Clear all stored tokens and user data immediately
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER);
  } catch {}

  // Notify all stores/navigators to un-authenticate and logout
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });

  setTimeout(() => {
    isEmitting = false;
  }, 1000);
};
