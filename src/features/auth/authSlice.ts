import { AuthState, User } from './auth.types';

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export type AuthAction =
  | { type: 'auth/setCredentials'; payload: { user: User; token: string } }
  | { type: 'auth/setTokenOnly'; payload: { token: string; user?: User | null } }
  | { type: 'auth/logout' }
  | { type: 'auth/setLoading'; payload: boolean }
  | { type: 'auth/setError'; payload: string | null };

export const authReducer = (state = initialAuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'auth/setCredentials':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
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
        error: null,
      };
    case 'auth/logout':
      return {
        ...initialAuthState,
        isLoading: false,
      };
    case 'auth/setLoading':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'auth/setError':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};
