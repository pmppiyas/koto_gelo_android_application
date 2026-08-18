import { rootReducer } from './rootReducer';

export const store = {
  getState: () => ({}),
  dispatch: (action: any) => action,
  subscribe: (listener: () => void) => () => {},
};

export type RootState = {
  [K in keyof typeof rootReducer]: ReturnType<(typeof rootReducer)[K]>;
};

export type AppDispatch = typeof store.dispatch;
