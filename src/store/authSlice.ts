import { AuthState, User } from './auth.types';

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export type AuthAction =
  | { type: 'auth/setCredentials'; payload: { token: string; user?: User | null } }
  | { type: 'auth/setTokenOnly'; payload: { token: string; user?: User | null } }
  | { type: 'auth/logout' }
  | { type: 'auth/setLoading'; payload: boolean }
  | { type: 'auth/setError'; payload: string | null }
  | { type: 'auth/setUser'; payload: User | null };

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'auth/setCredentials':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user || state.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'auth/setTokenOnly':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user || state.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'auth/logout':
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'auth/setLoading':
      return { ...state, isLoading: action.payload };
    case 'auth/setError':
      return { ...state, error: action.payload, isLoading: false };
    case 'auth/setUser':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};
