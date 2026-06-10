import { useEffect, useRef, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkCallback = (isConnected: boolean) => void;

let listeners: NetworkCallback[] = [];
let currentState = true;
let initialized = false;

function notify(isConnected: boolean) {
  currentState = isConnected;
  listeners.forEach(fn => fn(isConnected));
}

export function initNetworkListener() {
  if (initialized) return;
  initialized = true;

  NetInfo.addEventListener((state: NetInfoState) => {
    const online = !!(state.isConnected && state.isInternetReachable !== false);
    notify(online);
  });
}

export function useNetwork() {
  const callbackRef = useRef<NetworkCallback | null>(null);

  useEffect(() => {
    initNetworkListener();
  }, []);

  const onNetworkChange = useCallback((callback: NetworkCallback) => {
    callbackRef.current = callback;
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(fn => fn !== callback);
    };
  }, []);

  return { onNetworkChange, isConnected: currentState };
}
