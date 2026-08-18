export interface RequestInterceptor {
  onRequest?: (config: any) => Promise<any> | any;
  onError?: (error: any) => Promise<any> | any;
}

export interface ResponseInterceptor {
  onResponse?: (response: any) => Promise<any> | any;
  onError?: (error: any) => Promise<any> | any;
}

export const defaultInterceptors = {
  request: async (config: any) => config,
  response: async (response: any) => response,
  error: async (error: any) => Promise.reject(error),
};
