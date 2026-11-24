import { useState, useEffect, useCallback } from 'react';
import { DeviceAuthenticationService } from '../services/security/deviceAuthenticationService';
import { BiometricAuthStatus } from '../types/wallet';
import { useWalletStore } from '../store/walletStore';

export function useWalletAuthentication() {
  const [authStatus, setAuthStatus] = useState<BiometricAuthStatus>({
    hasHardware: false,
    isEnrolled: false,
    supportedTypes: [],
  });
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const { isUnlocked, setUnlocked } = useWalletStore();

  useEffect(() => {
    let isMounted = true;
    DeviceAuthenticationService.getStatus().then((status) => {
      if (isMounted) {
        setAuthStatus(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const authenticate = useCallback(
    async (promptMessage?: string): Promise<{ success: boolean; error?: string }> => {
      setIsAuthenticating(true);
      try {
        const result = await DeviceAuthenticationService.authenticate(promptMessage);
        if (result.success) {
          setUnlocked(true);
        }
        setIsAuthenticating(false);
        return result;
      } catch (err) {
        setIsAuthenticating(false);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Authentication failed.',
        };
      }
    },
    [setUnlocked]
  );

  const lock = useCallback(() => {
    setUnlocked(false);
  }, [setUnlocked]);

  return {
    authStatus,
    isUnlocked,
    isAuthenticating,
    authenticate,
    lock,
  };
}
