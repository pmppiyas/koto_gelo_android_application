import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authReducer, initialAuthState, AuthAction } from '../features/auth/authSlice';
import { AuthState } from '../features/auth/auth.types';
import { authService } from '../services/authService';

export interface RootState {
  auth: AuthState;
}

interface StoreContextType {
  state: RootState;
  dispatch: React.Dispatch<AuthAction>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const token = await authService.getStoredToken();
        if (token) {
          const user = await authService.getStoredUser();
          authDispatch({
            type: 'auth/setTokenOnly',
            payload: { token, user },
          });
        } else {
          authDispatch({ type: 'auth/setLoading', payload: false });
        }
      } catch (err) {
        authDispatch({ type: 'auth/setLoading', payload: false });
      }
    };

    checkAuthToken();
  }, []);

  const state: RootState = {
    auth: authState,
  };

  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch: authDispatch } },
    children
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
