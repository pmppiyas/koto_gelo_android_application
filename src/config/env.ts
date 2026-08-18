export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  API_TIMEOUT: Number(process.env.API_TIMEOUT) || 15000,
  IS_DEV: __DEV__,
};
