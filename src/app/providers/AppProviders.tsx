import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReduxProvider } from './ReduxProvider';
import { DatabaseProvider } from './DatabaseProvider';
import { AuthProvider } from '../../features/auth/context/AuthContext';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <DatabaseProvider>
          <AuthProvider>{children}</AuthProvider>
        </DatabaseProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
};
