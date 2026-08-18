export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export const initialNetworkState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
};

export const networkReducer = (state = initialNetworkState, action: { type: string; payload?: any }): NetworkState => {
  switch (action.type) {
    case 'network/setStatus':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        isInternetReachable: action.payload.isInternetReachable,
      };
    default:
      return state;
  }
};
