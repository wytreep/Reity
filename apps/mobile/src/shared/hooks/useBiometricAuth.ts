import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../lib/storage';

export function useBiometricAuth() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      const hasSession  = !!storage.getString('accessToken');
      setIsBiometricAvailable(hasHardware && isEnrolled && hasSession);
    })();
  }, []);

  async function authenticateWithBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Acceder a Reity',
        cancelLabel: 'Cancelar',
      });
      return result.success;
    } catch { return false; }
  }

  return { isBiometricAvailable, authenticateWithBiometric };
}
