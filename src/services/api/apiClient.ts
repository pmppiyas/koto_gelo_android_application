import { BaseApi } from './baseApi';
import { tokenService } from '../auth/token.service';

export class ApiClient extends BaseApi {
  protected async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    config?: any
  ) {
    const token = await tokenService.getAccessToken();
    const headers = {
      ...(config?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return super.request<T>(endpoint, method, data, { ...config, headers });
  }
}

export const apiClient = new ApiClient();
