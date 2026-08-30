import { ENV } from '../../config/env';
import { RequestConfig, ApiResponse } from './api.types';
import { handleUnauthorized } from '../../utils/authEvents';

import { authService } from '../authService';

let baseApiRefreshPromise: Promise<string | null> | null = null;

export class BaseApi {
  protected baseUrl: string;

  constructor(baseUrl: string = ENV.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  protected async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    config?: RequestConfig,
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      let resJson: any = null;
      try {
        resJson = await response.json();
      } catch {
        resJson = null;
      }

      const isAuthError =
        response.status === 401 ||
        resJson?.message?.toLowerCase()?.includes('expired') ||
        resJson?.message?.toLowerCase()?.includes('invalid token') ||
        resJson?.message?.toLowerCase()?.includes('unauthorized');

      if (isAuthError) {
        if (!isRetry && !endpoint.includes('/auth/')) {
          if (!baseApiRefreshPromise) {
            baseApiRefreshPromise = authService.refreshToken().finally(() => {
              baseApiRefreshPromise = null;
            });
          }
          const newToken = await baseApiRefreshPromise;
          if (newToken) {
            const retryHeaders = {
              ...(config?.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
            return this.request<T>(endpoint, method, data, { ...config, headers: retryHeaders }, true);
          }
        }
        handleUnauthorized();
      }

      if (!response.ok) {
        throw {
          status: response.status,
          message: resJson?.message || 'API request failed',
          data: resJson,
        };
      }

      return {
        data: resJson,
        status: response.status,
      };
    } catch (error: any) {
      if (error?.status) throw error;
      throw {
        status: 0,
        message: error?.message || 'Network connection error',
        data: null,
      };
    }
  }

  public get<T = any>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, 'GET', undefined, config);
  }

  public post<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, 'POST', data, config);
  }

  public put<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, 'PUT', data, config);
  }

  public patch<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, 'PATCH', data, config);
  }

  public delete<T = any>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, 'DELETE', undefined, config);
  }
}
