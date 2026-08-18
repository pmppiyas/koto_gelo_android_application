import { useState, useEffect } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export const useNetworkStatus = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {}, []);

  return networkState;
};
