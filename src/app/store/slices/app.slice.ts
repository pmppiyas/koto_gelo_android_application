export interface AppState {
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export const initialAppState: AppState = {
  isInitialized: false,
  theme: 'system',
  language: 'en',
};

export const appReducer = (state = initialAppState, action: { type: string; payload?: any }): AppState => {
  switch (action.type) {
    case 'app/setInitialized':
      return { ...state, isInitialized: action.payload };
    case 'app/setTheme':
      return { ...state, theme: action.payload };
    case 'app/setLanguage':
      return { ...state, language: action.payload };
    default:
      return state;
  }
};
