export interface AppError {
  message: string;
  statusCode?: number;
  code?: string;
  raw?: any;
}

export const extractErrorMessage = (error: unknown, fallback: string = 'An unexpected error occurred'): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const e = error as any;
    if (e.response?.data?.message) return e.response.data.message;
    if (e.message) return e.message;
  }
  return fallback;
};
