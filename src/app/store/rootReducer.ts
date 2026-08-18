import { authReducer } from './slices/auth.slice';
import { appReducer } from './slices/app.slice';
import { networkReducer } from './slices/network.slice';
import { uiReducer } from './slices/ui.slice';

export const rootReducer = {
  auth: authReducer,
  app: appReducer,
  network: networkReducer,
  ui: uiReducer,
};

export type RootReducerType = typeof rootReducer;
