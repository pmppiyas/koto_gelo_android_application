export interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authReducer = (state = initialAuthState, action: { type: string; payload?: any }): AuthState => {
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
    case 'auth/logout':
      return initialAuthState;
    case 'auth/setLoading':
      return { ...state, isLoading: action.payload };
    case 'auth/setError':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};
