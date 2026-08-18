export const appConfig = {
  name: 'KotoGelo',
  version: '1.0.0',
  defaultCurrency: 'BDT',
  supportedLanguages: ['en', 'bn'],
  defaultLanguage: 'en',
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  sync: {
    intervalMs: 30000,
    retryAttempts: 3,
  },
};
