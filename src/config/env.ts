export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://koto-gelo-backend.vercel.app/api/v1',
  API_TIMEOUT:
    Number(process.env.EXPO_PUBLIC_API_TIMEOUT || process.env.API_TIMEOUT) ||
    15000,
  IS_DEV: __DEV__,
};

