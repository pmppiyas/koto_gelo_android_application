import { useStore, RootState } from './store';
import { authService } from '../services/authService';
import { SignInPayload, SignUpPayload } from '../features/auth/auth.types';

export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  const { state } = useStore();
  return selector(state);
};

export const useAppDispatch = () => {
  const { dispatch } = useStore();
  return dispatch;
};

export const useAuth = () => {
  const { state, dispatch } = useStore();
  const auth = state.auth;

  const signin = async (payload: SignInPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signin(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    }
  };

  const signup = async (payload: SignUpPayload) => {
    dispatch({ type: 'auth/setLoading', payload: true });
    dispatch({ type: 'auth/setError', payload: null });
    try {
      const result = await authService.signup(payload);
      dispatch({ type: 'auth/setCredentials', payload: result });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      dispatch({ type: 'auth/setError', payload: msg });
      throw err;
    }
  };

  const logout = async () => {
    dispatch({ type: 'auth/setLoading', payload: true });
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'auth/logout' });
    }
  };

  return {
    ...auth,
    signin,
    signup,
    logout,
    clearError: () => dispatch({ type: 'auth/setError', payload: null }),
  };
};
