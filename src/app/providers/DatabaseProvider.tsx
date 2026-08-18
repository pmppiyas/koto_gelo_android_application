import React, { useEffect } from 'react';
import { database } from '../../services/database/database';

export interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  useEffect(() => {
    database.init().catch(() => {});
  }, []);

  return <>{children}</>;
};
