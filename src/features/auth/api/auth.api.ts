import { apiClient } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { SignInCredentials, SignUpCredentials, AuthResponse } from '../types/auth.types';

export const authApi = {
  signin: async (credentials: SignInCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNIN, credentials);
    return res.data;
  },

  signup: async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, credentials);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH);
    return res.data;
  },
};
