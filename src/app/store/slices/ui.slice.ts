export interface UIState {
  globalLoading: boolean;
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

export const initialUIState: UIState = {
  globalLoading: false,
  toast: null,
};

export const uiReducer = (state = initialUIState, action: { type: string; payload?: any }): UIState => {
  switch (action.type) {
    case 'ui/setGlobalLoading':
      return { ...state, globalLoading: action.payload };
    case 'ui/showToast':
      return { ...state, toast: action.payload };
    case 'ui/hideToast':
      return { ...state, toast: null };
    default:
      return state;
  }
};
